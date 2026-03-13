const crypto = require('crypto');
const fs = require('fs');

// Fill these in
const TEAM_ID = 'Y885X77VJ9';
const CLIENT_ID = 'com.colonelcornbred.reachorsettle.service';
const KEY_ID = 'D38DQY456S';
const PRIVATE_KEY_PATH = 'C:\\Projects\\ReachOrSettle\\AuthKey_D38DQY456S.p8'; // path to your .p8 file

const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEY_ID })).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const payload = Buffer.from(JSON.stringify({
  iss: TEAM_ID,
  iat: now,
  exp: now + 15777000,
  aud: 'https://appleid.apple.com',
  sub: CLIENT_ID,
})).toString('base64url');

const sign = crypto.createSign('SHA256');
sign.update(`${header}.${payload}`);
const signature = sign.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' }, 'base64url');

console.log(`${header}.${payload}.${signature}`);