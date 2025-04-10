// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DStore {
    // Structure to hold file metadata
    struct FileMetadata {
        string fileName;
        string ipfsHash;
        uint256 timestamp;
        bool isEncrypted;
    }

    // Maps user addresses to their files
    mapping(address => FileMetadata[]) private userFiles;

    // Total files stored in the contract
    uint256 public totalFiles;

    // Events
    event FileAdded(address indexed user, string ipfsHash, uint256 timestamp);
    event FileRemoved(address indexed user, string ipfsHash, uint256 timestamp);

    function addFile(string memory _fileName, string memory _ipfsHash) public {
        FileMetadata memory newFile = FileMetadata({
            fileName: _fileName,
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp,
            isEncrypted: true
        });
        userFiles[msg.sender].push(newFile);
        emit FileAdded(msg.sender, _ipfsHash, block.timestamp);
    }

    function getFileCount() public view returns (uint256) {
        return userFiles[msg.sender].length;
    }

    function getAllFiles()
        public
        view
        returns (
            string[] memory fileNames,
            string[] memory ipfsHashes,
            uint256[] memory timestamps,
            bool[] memory statuses
        )
    {
        uint256 count = userFiles[msg.sender].length;

        fileNames = new string[](count);
        ipfsHashes = new string[](count);
        timestamps = new uint256[](count);
        statuses = new bool[](count);

        for (uint256 i = 0; i < count; i++) {
            FileMetadata memory file = userFiles[msg.sender][i];
            fileNames[i] = file.fileName;
            ipfsHashes[i] = file.ipfsHash;
            timestamps[i] = file.timestamp;
            statuses[i] = file.isEncrypted;
        }

        return (fileNames, ipfsHashes, timestamps, statuses);
    }

    function removeFile(uint256 _index) public {
        require(_index < userFiles[msg.sender].length, "Index out of bounds");
        require(
            userFiles[msg.sender][_index].isEncrypted,
            "File already removed"
        );

        userFiles[msg.sender][_index].isEncrypted = false;

        // Emit event
        emit FileRemoved(
            msg.sender,
            userFiles[msg.sender][_index].ipfsHash,
            block.timestamp
        );
    }
}
