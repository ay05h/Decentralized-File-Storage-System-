const Nb = 4;
const Nk = 4;
const Nr = 10;

const sBox = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe,
  0xd7, 0xab, 0x76, 0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4,
  0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0, 0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7,
  0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15, 0x04, 0xc7, 0x23, 0xc3,
  0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75, 0x09,
  0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3,
  0x2f, 0x84, 0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe,
  0x39, 0x4a, 0x4c, 0x58, 0xcf, 0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85,
  0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8, 0x51, 0xa3, 0x40, 0x8f, 0x92,
  0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2, 0xcd, 0x0c,
  0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19,
  0x73, 0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14,
  0xde, 0x5e, 0x0b, 0xdb, 0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2,
  0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79, 0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5,
  0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08, 0xba, 0x78, 0x25,
  0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86,
  0xc1, 0x1d, 0x9e, 0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e,
  0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf, 0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42,
  0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16,
];

const invSBox = [
  0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81,
  0xf3, 0xd7, 0xfb, 0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e,
  0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb, 0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23,
  0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e, 0x08, 0x2e, 0xa1, 0x66,
  0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25, 0x72,
  0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65,
  0xb6, 0x92, 0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46,
  0x57, 0xa7, 0x8d, 0x9d, 0x84, 0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a,
  0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06, 0xd0, 0x2c, 0x1e, 0x8f, 0xca,
  0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b, 0x3a, 0x91,
  0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6,
  0x73, 0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8,
  0x1c, 0x75, 0xdf, 0x6e, 0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f,
  0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b, 0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2,
  0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4, 0x1f, 0xdd, 0xa8,
  0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f,
  0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93,
  0xc9, 0x9c, 0xef, 0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb,
  0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61, 0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6,
  0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d,
];

const rCon = [
  [0x00, 0x00, 0x00, 0x00],
  [0x01, 0x00, 0x00, 0x00],
  [0x02, 0x00, 0x00, 0x00],
  [0x04, 0x00, 0x00, 0x00],
  [0x08, 0x00, 0x00, 0x00],
  [0x10, 0x00, 0x00, 0x00],
  [0x20, 0x00, 0x00, 0x00],
  [0x40, 0x00, 0x00, 0x00],
  [0x80, 0x00, 0x00, 0x00],
  [0x1b, 0x00, 0x00, 0x00],
  [0x36, 0x00, 0x00, 0x00],
];

function keyExpansion(key) {
  const w = new Array(Nb * (Nr + 1));

  for (let i = 0; i < Nk; i++) {
    w[i] = [key[4 * i], key[4 * i + 1], key[4 * i + 2], key[4 * i + 3]];
  }

  for (let i = Nk; i < Nb * (Nr + 1); i++) {
    let temp = w[i - 1].slice();

    if (i % Nk === 0) {
      temp = [temp[1], temp[2], temp[3], temp[0]];
      for (let j = 0; j < 4; j++) {
        temp[j] = sBox[temp[j]];
      }

      for (let j = 0; j < 4; j++) {
        temp[j] ^= rCon[i / Nk][j];
      }
    }

    for (let j = 0; j < 4; j++) {
      w[i] = w[i] || [];
      w[i][j] = w[i - Nk][j] ^ temp[j];
    }
  }

  return w;
}

function subBytes(state) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < Nb; c++) {
      state[r][c] = sBox[state[r][c]];
    }
  }
  return state;
}

function invSubBytes(state) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < Nb; c++) {
      state[r][c] = invSBox[state[r][c]];
    }
  }
  return state;
}

function shiftRows(state) {
  const temp = Array(4)
    .fill()
    .map(() => Array(4).fill(0));

  for (let c = 0; c < 4; c++) {
    temp[0][c] = state[0][c];
  }

  for (let c = 0; c < 4; c++) {
    temp[1][c] = state[1][(c + 1) % 4];
  }

  for (let c = 0; c < 4; c++) {
    temp[2][c] = state[2][(c + 2) % 4];
  }

  for (let c = 0; c < 4; c++) {
    temp[3][c] = state[3][(c + 3) % 4];
  }

  return temp;
}

function invShiftRows(state) {
  const temp = Array(4)
    .fill()
    .map(() => Array(4).fill(0));

  for (let c = 0; c < 4; c++) {
    temp[0][c] = state[0][c];
  }

  for (let c = 0; c < 4; c++) {
    temp[1][c] = state[1][(c + 3) % 4];
  }

  for (let c = 0; c < 4; c++) {
    temp[2][c] = state[2][(c + 2) % 4];
  }

  for (let c = 0; c < 4; c++) {
    temp[3][c] = state[3][(c + 1) % 4];
  }

  return temp;
}

function gmul(a, b) {
  let p = 0;
  let hbs = 0;

  for (let i = 0; i < 8; i++) {
    if (b & 1) {
      p ^= a;
    }

    hbs = a & 0x80;
    a <<= 1;
    if (hbs) a ^= 0x1b;
    b >>= 1;
  }

  return p & 0xff;
}

function mixColumns(state) {
  const temp = Array(4)
    .fill()
    .map(() => Array(Nb).fill(0));

  for (let c = 0; c < 4; c++) {
    temp[0][c] =
      gmul(0x02, state[0][c]) ^
      gmul(0x03, state[1][c]) ^
      state[2][c] ^
      state[3][c];
    temp[1][c] =
      state[0][c] ^
      gmul(0x02, state[1][c]) ^
      gmul(0x03, state[2][c]) ^
      state[3][c];
    temp[2][c] =
      state[0][c] ^
      state[1][c] ^
      gmul(0x02, state[2][c]) ^
      gmul(0x03, state[3][c]);
    temp[3][c] =
      gmul(0x03, state[0][c]) ^
      state[1][c] ^
      state[2][c] ^
      gmul(0x02, state[3][c]);
  }

  return temp;
}

function invMixColumns(state) {
  const temp = Array(4)
    .fill()
    .map(() => Array(Nb).fill(0));

  for (let c = 0; c < 4; c++) {
    temp[0][c] =
      gmul(0x0e, state[0][c]) ^
      gmul(0x0b, state[1][c]) ^
      gmul(0x0d, state[2][c]) ^
      gmul(0x09, state[3][c]);
    temp[1][c] =
      gmul(0x09, state[0][c]) ^
      gmul(0x0e, state[1][c]) ^
      gmul(0x0b, state[2][c]) ^
      gmul(0x0d, state[3][c]);
    temp[2][c] =
      gmul(0x0d, state[0][c]) ^
      gmul(0x09, state[1][c]) ^
      gmul(0x0e, state[2][c]) ^
      gmul(0x0b, state[3][c]);
    temp[3][c] =
      gmul(0x0b, state[0][c]) ^
      gmul(0x0d, state[1][c]) ^
      gmul(0x09, state[2][c]) ^
      gmul(0x0e, state[3][c]);
  }

  return temp;
}

function addRoundKey(state, roundKey) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < Nb; c++) {
      state[r][c] ^= roundKey[c][r];
    }
  }
  return state;
}

function encryptBlock(input, key) {
  let state = Array(4)
    .fill()
    .map(() => Array(Nb).fill(0));
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < Nb; c++) {
      state[r][c] = input[r + 4 * c];
    }
  }

  const w = keyExpansion(key);

  let roundKey = w.slice(0, Nb);
  state = addRoundKey(state, roundKey);

  for (let round = 1; round < Nr; round++) {
    state = subBytes(state);
    state = shiftRows(state);
    state = mixColumns(state);
    roundKey = w.slice(round * Nb, (round + 1) * Nb);
    state = addRoundKey(state, roundKey);
  }

  state = subBytes(state);
  state = shiftRows(state);
  roundKey = w.slice(Nr * Nb, (Nr + 1) * Nb);
  state = addRoundKey(state, roundKey);

  const output = new Uint8Array(16);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < Nb; c++) {
      output[r + 4 * c] = state[r][c];
    }
  }

  return output;
}

function decryptBlock(input, key) {
  let state = Array(4)
    .fill()
    .map(() => Array(Nb).fill(0));
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < Nb; c++) {
      state[r][c] = input[r + 4 * c];
    }
  }

  const w = keyExpansion(key);

  let roundKey = w.slice(Nr * Nb, (Nr + 1) * Nb);
  state = addRoundKey(state, roundKey);

  for (let round = Nr - 1; round > 0; round--) {
    state = invShiftRows(state);
    state = invSubBytes(state);
    roundKey = w.slice(round * Nb, (round + 1) * Nb);
    state = addRoundKey(state, roundKey);
    state = invMixColumns(state);
  }

  state = invShiftRows(state);
  state = invSubBytes(state);
  roundKey = w.slice(0, Nb);
  state = addRoundKey(state, roundKey);

  const output = new Uint8Array(16);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < Nb; c++) {
      output[r + 4 * c] = state[r][c];
    }
  }

  return output;
}

function pad(data) {
  const paddingLength = 16 - (data.length % 16);
  const padded = new Uint8Array(data.length + paddingLength);
  padded.set(data);
  for (let i = data.length; i < padded.length; i++) {
    padded[i] = paddingLength;
  }
  return padded;
}

function unpad(data) {
  const paddingLength = data[data.length - 1];
  return data.slice(0, data.length - paddingLength);
}

async function encryptImage(imageFile, keyString) {
  return new Promise((resolve) => {
    const encoder = new TextEncoder();
    let keyBytes = encoder.encode(keyString);

    if (keyBytes.length < 16) {
      const paddedKey = new Uint8Array(16);
      paddedKey.set(keyBytes);
      keyBytes = paddedKey;
    } else if (keyBytes.length > 16) {
      keyBytes = keyBytes.slice(0, 16);
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const arrayBuffer = e.target.result;
      const imageData = new Uint8Array(arrayBuffer);

      const paddedData = pad(imageData);

      const encryptedData = new Uint8Array(paddedData.length);
      for (let i = 0; i < paddedData.length; i += 16) {
        const block = paddedData.slice(i, i + 16);
        const encryptedBlock = encryptBlock(block, keyBytes);
        encryptedData.set(encryptedBlock, i);
      }

      const encryptedBlob = new Blob([encryptedData], {
        type: "application/octet-stream",
      });

      resolve(encryptedBlob);
    };

    reader.readAsArrayBuffer(imageFile);
  });
}

async function decryptImage(encryptedFile, keyString) {
  return new Promise((resolve) => {
    const encoder = new TextEncoder();
    let keyBytes = encoder.encode(keyString);
    if (keyBytes.length < 16) {
      const paddedKey = new Uint8Array(16);
      paddedKey.set(keyBytes);
      keyBytes = paddedKey;
    } else if (keyBytes.length > 16) {
      keyBytes = keyBytes.slice(0, 16);
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const arrayBuffer = e.target.result;
      const encryptedData = new Uint8Array(arrayBuffer);

      const decryptedData = new Uint8Array(encryptedData.length);
      for (let i = 0; i < encryptedData.length; i += 16) {
        const block = encryptedData.slice(i, i + 16);
        const decryptedBlock = decryptBlock(block, keyBytes);
        decryptedData.set(decryptedBlock, i);
      }

      const unpaddedData = unpad(decryptedData);

      const decryptedBlob = new Blob([unpaddedData], { type: "image/png" });

      resolve(decryptedBlob);
    };

    reader.readAsArrayBuffer(encryptedFile);
  });
}

export { encryptImage, decryptImage };
