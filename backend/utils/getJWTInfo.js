import jwt from "jsonwebtoken";

const decodedToken = (token) => jwt.decode(token);

export { decodedToken }