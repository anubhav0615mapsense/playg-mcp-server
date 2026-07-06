import axios from "axios";

// Helper function for making playg API requests
const userAgent = process.env.USER_AGENT ?? '';
const bearerToken = process.env.BEARER_TOKEN ?? '';

export default async function makePlaygReq<res>(req_type: string, url: string, data?: Object, params?: Object): Promise <res> {
  const headers = {
    "User-Agent": userAgent,
    Accept: "application/json",
    Authorization: `Bearer ${bearerToken}`
  };
  
  try {
    const response = await axios.request({
      method: req_type,
      url,
      headers,
      data,
      params
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