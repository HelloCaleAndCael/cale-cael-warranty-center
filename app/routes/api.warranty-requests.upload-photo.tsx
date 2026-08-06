import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { v2 as cloudinary } from "cloudinary";
 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
 
// Browsers send an OPTIONS "preflight" request before the real POST.
// React Router routes OPTIONS to the loader, so this is required even
// though this route otherwise has no GET use case.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.public.customerAccount(request);
};
 
// POST /api/warranty-requests/upload-photo -> receives {fileName, base64}
// and uploads the image to Cloudinary, returning its public URL
export const action = async ({ request }: ActionFunctionArgs) => {
  const { sessionToken, cors } = await authenticate.public.customerAccount(request);
 
  if (!sessionToken.sub) {
    return cors(
      Response.json({ error: "Customer is not signed in or app lacks customer data access" }, { status: 401 })
    );
  }
 
  const { base64 } = await request.json();
 
  try {
    const result = await cloudinary.uploader.upload(base64, {
      folder: "warranty-requests",
      resource_type: "auto", // lets Cloudinary accept images AND videos
    });
    return cors(Response.json({ url: result.secure_url }));
  } catch (err: any) {
    // This log shows up in your `shopify app dev` terminal
    console.error("Cloudinary upload failed:", err);
    return cors(
      Response.json(
        { error: `Cloudinary upload failed: ${err.message || String(err)}` },
        { status: 500 }
      )
    );
  }
};