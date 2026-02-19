import Vapi from "@vapi-ai/web";

// Initialize the Vapi instance with your Public Key
// We use the '!' to tell TypeScript we know this key exists in .env.local
const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);

export default vapi;