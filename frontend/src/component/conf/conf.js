const conf = {
  pinata_api_key: String(import.meta.env.VITE_PINATA_API_KEY),
  pinata_secret_key: String(import.meta.env.VITE_PINATA_SECRET_API_KEY),
  contract_address: String(import.meta.env.VITE_CONTRACT_ADDRESS),
};

export default conf;
