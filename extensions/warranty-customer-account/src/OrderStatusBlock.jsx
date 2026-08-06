// @ts-nocheck
import '@shopify/ui-extensions/preact';
import {render} from 'preact';
 
export default async () => {
  render(<Extension />, document.body);
};
 
function Extension() {
  function goToWarrantyPage() {
    // Links to the full-page extension by its handle.
    // Note: the customer will fill in the product/order manually on the
    // next screen — that's exactly why the form has an
    // "Order number (if you have it)" field.
    shopify.navigation.navigate('extension:warranty-requests-page/');
  }
 
  return (
    <s-section>
      <s-heading>🛡 CALE & CAEL Lifetime Warranty</s-heading>
 
      <s-text>Your handcrafted leather piece is covered by our Lifetime Warranty.</s-text>
 
      <s-text>
        If your item requires repair, restoration, replacement or another warranty service, you
        can submit a request.
      </s-text>
 
      <s-button onClick={goToWarrantyPage}>Apply Warranty</s-button>
    </s-section>
  );
}