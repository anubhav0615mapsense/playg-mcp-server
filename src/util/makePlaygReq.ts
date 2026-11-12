import axios, { AxiosRequestHeaders } from "axios";

// Helper function for making playg API requests
const userAgent = process.env.USER_AGENT ?? '';

export default async function makePlaygReq<res>(req_type: string, url: string, authToken: string, data?: Object): Promise <res> {
  
  const headers = {
    "User-Agent": userAgent,
    Accept: "application/json",
    Authorization: `Bearer ${authToken}`
  };

  try {
    const response = await axios.request({
      method: req_type,
      url,
      headers,
      data
    });
    return response as res;
  } catch (err: any) {
    if (axios.isAxiosError(err) && err.response) {
      throw new Error(JSON.stringify({
        status: err.response.status,
        message: err.response.data
      }))
    }
    throw new Error(`Error occurred: ${err.message}`)
  }
}