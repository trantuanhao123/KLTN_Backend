import dotenv from "dotenv";
import PayOS from "@payos/node";

dotenv.config();

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  apiHost: process.env.PAYOS_API_HOST,
});

export default payos;
