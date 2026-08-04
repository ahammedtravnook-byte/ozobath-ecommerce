import PageHero from '@components/PageHero';
import ScrollReveal from '@components/ScrollReveal';

// ============================================
// OZOBATH - Refund & Cancellation Policy
// ============================================
// Razorpay requires a publicly reachable refund/cancellation policy before
// it will activate a merchant account, and it must be linked from the
// footer alongside Terms, Privacy, Shipping and Contact.
//
// DRAFT — the return window, who bears return shipping, and the exact
// scope of the shower-enclosure exclusion were specified by the merchant
// but this wording has NOT been reviewed by a lawyer. Confirm before
// relying on it in a dispute.

const RefundPolicyPage = () => (
    <div className="bg-[#ffffff]">
        <PageHero
            title="Refund & Cancellation Policy"
            subtitle="Returns, refunds, cancellations and what is covered."
            breadcrumbs={[{ label: 'Refund Policy' }]}
            compact
        />
        <section className="section-wrapper">
            <ScrollReveal className="max-w-3xl mx-auto">
                <div className="glass-morph p-5 sm:p-8 md:p-12">
                    <div className="prose prose-lg prose-gray max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:text-dark-900 prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-p:text-dark-500 prose-p:leading-relaxed prose-li:text-dark-500">

                        <section>
                            <h2>Order Cancellation</h2>
                            <p>Orders can be cancelled free of charge at any time before they are dispatched. To cancel, go to <strong>My Orders</strong> and select Cancel, or contact our support team.</p>
                            <p>Once an order has been dispatched it can no longer be cancelled, and the return process below applies instead.</p>
                        </section>

                        <section>
                            <h2>Returns — Standard Products</h2>
                            <p>Standard catalogue products may be returned within <strong>7 days of delivery</strong>, provided the item is:</p>
                            <ul>
                                <li>Unused, uninstalled and in its original condition</li>
                                <li>In the original packaging with all accessories, fittings and documentation</li>
                                <li>Accompanied by the original invoice</li>
                            </ul>
                            <p>To start a return, contact us within the 7-day window with your order number and photographs of the item.</p>
                        </section>

                        <section>
                            <h2>Shower Enclosures — Not Returnable</h2>
                            <p><strong>Shower enclosures are made to order and cannot be returned or refunded.</strong> Each enclosure is cut, toughened and assembled to the measurements confirmed for your specific installation, and cannot be restocked or resold.</p>
                            <p>Please confirm all measurements and specifications carefully before placing an enclosure order. Our team is available to assist before you order.</p>
                            <p>This exclusion does not affect your rights in respect of a damaged or defective enclosure — see below.</p>
                        </section>

                        <section>
                            <h2>Damaged or Defective Items</h2>
                            <p>This applies to <strong>all products, including shower enclosures</strong>.</p>
                            <p>If an item arrives damaged, defective, or is not what you ordered, report it within <strong>48 hours of delivery</strong> with photographs of the item and its packaging. We will arrange a free replacement or a full refund, including any shipping charges paid.</p>
                            <p>Please inspect your delivery on arrival. Damage reported after 48 hours may not be eligible, as we are unable to establish whether it occurred in transit.</p>
                        </section>

                        <section>
                            <h2>Return Shipping</h2>
                            <p>Where an item is damaged, defective or incorrect, <strong>we bear the return shipping cost</strong> and arrange collection.</p>
                            <p>Where a return is for any other reason — a change of mind, for example — the return shipping cost is borne by the customer, and the original shipping charge is not refunded.</p>
                        </section>

                        <section>
                            <h2>Refund Processing</h2>
                            <p>Approved refunds are issued to the original payment method within <strong>5–7 business days</strong> of us receiving and inspecting the returned item.</p>
                            <p>Once we process a refund, your bank or card issuer may take a further 3–5 business days to credit it. This part is outside our control.</p>
                            <p>Cash on Delivery orders are refunded by bank transfer to an account you nominate.</p>
                        </section>

                        <section>
                            <h2>Non-Returnable Items</h2>
                            <ul>
                                <li>Made-to-order shower enclosures and custom-sized glass</li>
                                <li>Items that have been installed, modified or used</li>
                                <li>Items returned without original packaging or accessories</li>
                                <li>Products damaged by incorrect installation or misuse</li>
                                <li>Clearance or final-sale items marked as non-returnable</li>
                            </ul>
                        </section>

                        <section>
                            <h2>Contact Us</h2>
                            <p>For any return, refund or cancellation request, contact our support team through the <strong>Contact</strong> page with your order number. We aim to respond within one business day.</p>
                        </section>

                    </div>
                </div>
            </ScrollReveal>
        </section>
    </div>
);

export default RefundPolicyPage;
