import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role: only ever used on the server
);

// GET /api/warranty-requests -> lists the logged-in customer's requests
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { sessionToken, cors } = await authenticate.public.customerAccount(request);
  const customerId = sessionToken.sub;

  if (!customerId) {
    // sub is only present once the app has Protected Customer Data access
    return cors(
      Response.json({ error: "Customer is not signed in or app lacks customer data access" }, { status: 401 })
    );
  }

  const { data, error } = await supabase
    .from("warranty_requests")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    return cors(Response.json({ error: error.message }, { status: 500 }));
  }

  return cors(Response.json({ requests: data }));
};

// POST /api/warranty-requests -> creates a new warranty request
export const action = async ({ request }: ActionFunctionArgs) => {
  const { sessionToken, cors } = await authenticate.public.customerAccount(request);
  const customerId = sessionToken.sub;

  if (!customerId) {
    return cors(
      Response.json({ error: "Customer is not signed in or app lacks customer data access" }, { status: 401 })
    );
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from("warranty_requests")
    .insert({
      customer_id: customerId,
      product_name: body.productName,
      order_number: body.orderNumber || null,
      warranty_type: body.warrantyType,
      description: body.description,
      photo_urls: body.photoUrls || [],
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return cors(Response.json({ error: error.message }, { status: 500 }));
  }

  return cors(Response.json({ request: data }));
};