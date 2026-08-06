import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import { authenticate } from "../shopify.server";
import { createClient } from "@supabase/supabase-js";
 
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
 
const STATUS_OPTIONS = ["pending", "approved", "in_progress", "rejected"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  in_progress: "In progress",
  rejected: "Rejected",
  completed: "Completed",
};
 
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
 
  const { data, error } = await supabase
    .from("warranty_requests")
    .select("*")
    .order("created_at", { ascending: false });
 
  if (error) throw new Response(error.message, { status: 500 });
 
  // Look up each unique customer's name/email from Shopify (we only store
  // the customer_id in Supabase, not their personal info)
  const uniqueCustomerIds = [...new Set(data.map((r) => r.customer_id))];
  const customerInfoById: Record<string, {name: string; email: string}> = {};
 
  await Promise.all(
    uniqueCustomerIds.map(async (customerId) => {
      try {
        const response = await admin.graphql(
          `#graphql
          query GetCustomer($id: ID!) {
            customer(id: $id) {
              firstName
              lastName
              email
            }
          }`,
          {variables: {id: customerId}}
        );
        const {data: customerData} = await response.json();
        const customer = customerData?.customer;
        customerInfoById[customerId] = {
          name: customer ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim() : "Unknown",
          email: customer?.email || "",
        };
      } catch {
        customerInfoById[customerId] = {name: "Unknown", email: ""};
      }
    })
  );
 
  const requestsWithCustomer = data.map((r) => ({
    ...r,
    customer_name: customerInfoById[r.customer_id]?.name || "Unknown",
    customer_email: customerInfoById[r.customer_id]?.email || "",
  }));
 
  return { requests: requestsWithCustomer };
};
 
// Handles the status-change form submitted from each row
export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);
 
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  const adminNotes = formData.get("adminNotes") as string;
 
  const { error } = await supabase
    .from("warranty_requests")
    .update({ status, admin_notes: adminNotes })
    .eq("id", id);
 
  if (error) return { error: error.message };
  return { success: true };
};
 
export default function WarrantyAdmin() {
  const { requests } = useLoaderData<typeof loader>();
 
  return (
    <s-page heading="Warranty Requests">
      <s-section>
        {requests.length === 0 && <s-text>No warranty requests yet.</s-text>}
 
        {requests.map((r: any) => (
          <RequestRow key={r.id} request={r} />
        ))}
      </s-section>
    </s-page>
  );
}
 
function RequestRow({ request }: { request: any }) {
  const fetcher = useFetcher();
 
  function updateStatus(newStatus: string) {
    fetcher.submit(
      { id: request.id, status: newStatus, adminNotes: request.admin_notes || "" },
      { method: "post" }
    );
  }
 
  const isCompleted = request.status === "completed";
 
  return (
    <s-section
      heading={request.product_name}
      style={
        isCompleted
          ? {background: "#3a3a3c", borderRadius: "8px", color: "#f0f0f0"}
          : undefined
      }
    >
      <s-stack direction="block" gap="small-400" style={isCompleted ? {color: "#f0f0f0"} : undefined}>
        <s-text color={isCompleted ? undefined : "subdued"}>
          Order: {request.order_number || "N/A"} · Type: {request.warranty_type}
        </s-text>
 
        <s-stack direction="inline" gap="base">
          <s-text style={isCompleted ? {color: "#f0f0f0"} : undefined}>
            <s-text type="strong">Customer:</s-text> {request.customer_name}
          </s-text>
          {request.customer_email && (
            <s-button
              variant="tertiary"
              onClick={() => navigator.clipboard.writeText(request.customer_email)}
            >
              📋 {request.customer_email}
            </s-button>
          )}
        </s-stack>
 
        <s-text style={isCompleted ? {color: "#f0f0f0"} : undefined}>{request.description}</s-text>
 
        {request.photo_urls?.length > 0 && (
          <s-stack direction="inline" gap="small-400">
            {request.photo_urls.map((url: string, i: number) => (
              <s-link key={i} href={url} target="_blank">
                Photo {i + 1}
              </s-link>
            ))}
          </s-stack>
        )}
 
        {request.status === "completed" ? (
          <s-stack direction="block" gap="small-300">
            <s-banner tone="success">
              ✅ This request is completed and locked.
            </s-banner>
            <s-button variant="tertiary" onClick={() => updateStatus("approved")}>
              Reopen (undo completion)
            </s-button>
          </s-stack>
        ) : (
          <s-stack direction="block" gap="small-300">
            <s-text type="strong">Status</s-text>
            <s-stack direction="inline" gap="small-300">
              {STATUS_OPTIONS.map((status) => (
                <s-button
                  key={status}
                  variant={request.status === status ? "primary" : "secondary"}
                  onClick={() => updateStatus(status)}
                >
                  {STATUS_LABELS[status]}
                </s-button>
              ))}
            </s-stack>
            <s-button variant="tertiary" onClick={() => updateStatus("completed")}>
              Mark as completed (locks this request)
            </s-button>
          </s-stack>
        )}
      </s-stack>
    </s-section>
  );
}