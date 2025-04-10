import { React, useEffect, useState } from "react";
import axios from "axios";
import { encryptImage, decryptImage } from "../security/aes_encryption";
import conf from "./conf/conf";
import BlockchainService from "./services/eth_Service";

const FileUpload = ({ files }) => {
  const PINATA_API_KEY = conf.pinata_api_key;
  const PINATA_SECRET_API_KEY = conf.pinata_secret_key;

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [encryptionKey, setEncryptionKey] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileDecryptionKeys, setFileDecryptionKeys] = useState({});
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState({});
  const [error, setError] = useState("");
  const [downloadedFile, setDownloadedFile] = useState(null);

  useEffect(() => {
    if (files.length > 0) {
      setUploadedFiles(files);
      // Initialize decryption keys and loading states for each file
      const initialDecryptionKeys = {};
      const initialDecryptingStates = {};
      files.forEach((file) => {
        initialDecryptionKeys[file.ipfsHash] = "";
        initialDecryptingStates[file.ipfsHash] = false;
      });
      setFileDecryptionKeys(initialDecryptionKeys);
      setIsDecrypting(initialDecryptingStates);
    } else {
      setUploadedFiles([]);
      setFileDecryptionKeys({});
      setIsDecrypting({});
    }
  }, [files]);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const uploadToPinata = async (fileToUpload) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", fileToUpload);

      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_API_KEY,
          },
        }
      );

      const newFile = {
        fileName: fileName,
        ipfsHash: response.data.IpfsHash,
        timestamp: new Date().toLocaleString(),
        isEncrypted: true,
      };
      const uploadedFile = await BlockchainService.addFile(
        fileName,
        response.data.IpfsHash
      );

      const updatedFiles = [...uploadedFiles, newFile];
      setUploadedFiles(updatedFiles);

      // Initialize decryption key and loading state for new file
      setFileDecryptionKeys((prev) => ({
        ...prev,
        [response.data.IpfsHash]: "",
      }));
      setIsDecrypting((prev) => ({
        ...prev,
        [response.data.IpfsHash]: false,
      }));

      setFile(null);
      setFileName("");
      setEncryptionKey("");

      // Switch to the files tab to show the user their uploaded file
      setActiveTab("files");
    } catch (err) {
      console.error("Error uploading to IPFS:", err);
      throw new Error("Failed to upload to IPFS: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const encryptAndUpload = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    if (!encryptionKey) {
      setError("Please enter an encryption key");
      return;
    }

    setIsEncrypting(true);
    setError("");

    try {
      await BlockchainService.refreshAccount();
      const encryptedBlob = await encryptImage(file, encryptionKey);
      const encryptedFile = new File([encryptedBlob], `${fileName}.encrypted`, {
        type: "application/octet-stream",
      });

      await uploadToPinata(encryptedFile);
    } catch (err) {
      console.error("Error during encryption:", err);
      setError("Failed to encrypt and upload file: " + err.message);
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleDecryptionKeyChange = (hash, value) => {
    setFileDecryptionKeys((prev) => ({
      ...prev,
      [hash]: value,
    }));
  };

  const downloadAndDecrypt = async (hash, originalName, encryptedKey) => {
    const decryptionKey = fileDecryptionKeys[hash];

    if (!decryptionKey) {
      setError("Please enter a decryption key for this file");
      return;
    }

    // Set decrypting state for this specific file
    setIsDecrypting((prev) => ({
      ...prev,
      [hash]: true,
    }));
    setError("");

    try {
      // Download the encrypted file from IPFS
      const dKey = encryptedKey
        ? await BlockchainService.getDecryptedKey(encryptedKey)
        : decryptionKey;

      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${hash}`;
      const response = await fetch(ipfsUrl);
      const encryptedBlob = await response.blob();

      // Decrypt the file
      const decryptedBlob = await decryptImage(encryptedBlob, dKey);

      // Create a download link for the decrypted file
      const downloadUrl = URL.createObjectURL(decryptedBlob);
      setDownloadedFile({
        url: downloadUrl,
        name: originalName || fileName,
      });

      // Optional: Automatically trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = originalName || fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clear decryption key after successful decryption
      handleDecryptionKeyChange(hash, "");
    } catch (err) {
      console.error("Error during download and decryption:", err);
      setError("Failed to download or decrypt file: " + err.message);
    } finally {
      setIsDecrypting((prev) => ({
        ...prev,
        [hash]: false,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">
            SecureIPFS
          </h1>
          <p className="text-gray-600">
            End-to-end encrypted file storage on IPFS
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 py-4 px-6 text-center ${
                activeTab === "upload"
                  ? "bg-white text-indigo-600 border-b-2 border-indigo-600 font-medium"
                  : "bg-gray-50 text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("upload")}
            >
              Upload Files
            </button>
            <button
              className={`flex-1 py-4 px-6 text-center ${
                activeTab === "files"
                  ? "bg-white text-indigo-600 border-b-2 border-indigo-600 font-medium"
                  : "bg-gray-50 text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("files")}
            >
              My Files
              {uploadedFiles.length > 0 && (
                <span className="ml-2 bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-full px-2 py-1">
                  {uploadedFiles.length}
                </span>
              )}
            </button>
          </div>

          {/* Upload Tab */}
          {activeTab === "upload" && (
            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                  Encrypt and Upload Your Files
                </h2>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File Selection
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center ${
                      file
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-gray-300 hover:border-indigo-300"
                    }`}
                  >
                    {file ? (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                          <svg
                            className="w-8 h-8 text-indigo-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="font-medium text-indigo-600">
                          {fileName}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {Math.round(file.size / 1024)} KB
                        </p>
                        <button
                          onClick={() => {
                            setFile(null);
                            setFileName("");
                          }}
                          className="mt-3 text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          Change file
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <svg
                          className="w-12 h-12 text-gray-400 mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <p className="mb-2 text-sm font-medium text-gray-700">
                          Drop your file here, or
                        </p>
                        <label className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 cursor-pointer">
                          Browse Files
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Encryption Key
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <input
                      type="password"
                      value={encryptionKey}
                      onChange={(e) => setEncryptionKey(e.target.value)}
                      placeholder="Enter a secure key for encryption/decryption"
                      className="block w-full h-12 pr-10 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 116 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    <span className="font-medium text-indigo-600">
                      Important:
                    </span>{" "}
                    Remember this key. You'll need it to decrypt your files
                    later.
                  </p>
                </div>

                <div className="mt-8">
                  <button
                    onClick={encryptAndUpload}
                    disabled={
                      isEncrypting || uploading || !file || !encryptionKey
                    }
                    className={`w-full flex items-center justify-center px-4 py-3 rounded-md ${
                      isEncrypting || uploading || !file || !encryptionKey
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    } text-white font-medium focus:outline-none focus:ring-4 focus:ring-indigo-200`}
                  >
                    {isEncrypting || uploading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        {isEncrypting ? "Encrypting..." : "Uploading..."}
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        Encrypt & Upload to IPFS
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  How it works
                </h3>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 bg-indigo-50 p-4 rounded-lg">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold mb-2">
                      1
                    </div>
                    <h4 className="font-medium mb-1">Encrypt</h4>
                    <p className="text-sm text-gray-600">
                      Your file is encrypted locally using your secret key
                    </p>
                  </div>
                  <div className="flex-1 bg-indigo-50 p-4 rounded-lg">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold mb-2">
                      2
                    </div>
                    <h4 className="font-medium mb-1">Upload</h4>
                    <p className="text-sm text-gray-600">
                      Encrypted data is uploaded to decentralized IPFS network
                    </p>
                  </div>
                  <div className="flex-1 bg-indigo-50 p-4 rounded-lg">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold mb-2">
                      3
                    </div>
                    <h4 className="font-medium mb-1">Access</h4>
                    <p className="text-sm text-gray-600">
                      Decrypt and download your files using your secret key
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Files Tab */}
          {activeTab === "files" && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  My Encrypted Files
                </h2>
                {uploadedFiles.length > 0 && (
                  <div className="text-sm text-gray-500">
                    {uploadedFiles.length} file
                    {uploadedFiles.length !== 1 && "s"}
                  </div>
                )}
              </div>

              {uploadedFiles.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No files uploaded
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start by uploading an encrypted file.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setActiveTab("upload")}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <svg
                        className="-ml-1 mr-2 h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Upload a File
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            File Name
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            IPFS Hash
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Uploaded
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Decryption
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {uploadedFiles.map((file, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                  <svg
                                    className="h-6 w-6 text-indigo-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {file.fileName}
                                  </div>
                                  {file.isEncrypted && (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                      Encrypted
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-500">
                              <div
                                className="truncate max-w-xs"
                                title={file.ipfsHash}
                              >
                                {file.ipfsHash}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {file.timestamp}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {file.isEncrypted && (
                                <div className="relative rounded-md shadow-sm">
                                  <input
                                    type="password"
                                    value={
                                      fileDecryptionKeys[file.ipfsHash] || ""
                                    }
                                    onChange={(e) =>
                                      handleDecryptionKeyChange(
                                        file.ipfsHash,
                                        e.target.value
                                      )
                                    }
                                    placeholder="Enter decryption key"
                                    className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  />
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-3">
                                <a
                                  href={`https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                >
                                  <svg
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                  </svg>
                                  View
                                </a>
                                {file.isEncrypted && (
                                  <button
                                    onClick={() =>
                                      downloadAndDecrypt(
                                        file.ipfsHash,
                                        file.fileName,
                                        file.encryptionKey
                                      )
                                    }
                                    disabled={
                                      isDecrypting[file.ipfsHash] ||
                                      !fileDecryptionKeys[file.ipfsHash]
                                    }
                                    className={`flex items-center ${
                                      isDecrypting[file.ipfsHash] ||
                                      !fileDecryptionKeys[file.ipfsHash]
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-green-600 hover:text-green-900"
                                    }`}
                                  >
                                    {isDecrypting[file.ipfsHash] ? (
                                      <>
                                        <svg
                                          className="animate-spin -ml-1 mr-2 h-4 w-4"
                                          xmlns="http://www.w3.org/2000/svg"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                        >
                                          <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                          ></circle>
                                          <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                          ></path>
                                        </svg>
                                        Decrypting...
                                      </>
                                    ) : (
                                      <>
                                        <svg
                                          className="w-4 h-4 mr-1"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                          />
                                        </svg>
                                        Decrypt & Download
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Error message for file tab */}
              {error && (
                <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* File successfully downloaded notification */}
              {downloadedFile && (
                <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-green-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-800">
                        Successfully decrypted and downloaded{" "}
                        <span className="font-medium">
                          {downloadedFile.name}
                        </span>
                      </p>
                      <div className="mt-2">
                        <button
                          onClick={() => setDownloadedFile(null)}
                          className="text-xs text-green-600 hover:text-green-800 font-medium"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Information about decryption */}
              <div className="mt-8 px-4 py-5 bg-gray-50 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      About file decryption
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>
                          Enter the same encryption key you used when uploading
                          to decrypt your files
                        </li>
                        <li>
                          Decryption happens locally in your browser - your keys
                          are never sent to any server
                        </li>
                        <li>
                          If you forget your decryption key, there is no way to
                          recover your files
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            SecureIPFS - End-to-end encrypted file storage on the InterPlanetary
            File System
          </p>
          <p className="mt-1">
            Your files are encrypted locally before being stored on IPFS. Only
            you have the keys to decrypt them.
          </p>
          <div className="mt-4 flex justify-center space-x-6">
            <a href="#" className="text-gray-500 hover:text-indigo-600">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-500 hover:text-indigo-600">
              Terms of Service
            </a>
            <a href="#" className="text-gray-500 hover:text-indigo-600">
              Contact
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
