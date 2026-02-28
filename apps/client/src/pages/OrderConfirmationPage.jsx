import { Link, useParams } from 'react-router-dom';

const OrderConfirmationPage = () => {
    const { orderId } = useParams();
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full text-center">
                <div className="bg-white rounded-2xl p-8 shadow-soft">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><span className="text-4xl">🎉</span></div>
                    <h1 className="text-2xl font-display font-bold text-dark-900 mb-2">Order Confirmed!</h1>
                    <p className="text-gray-500 mb-4">Thank you for shopping with OZOBATH</p>
                    <div className="bg-gray-50 rounded-lg p-4 mb-6"><p className="text-xs text-gray-400 mb-1">Order ID</p><p className="text-sm font-mono font-semibold text-dark-900">{orderId}</p></div>
                    <p className="text-sm text-gray-500 mb-6">We've sent a confirmation email with your order details. You'll receive tracking updates once your order ships.</p>
                    <div className="flex flex-col gap-3">
                        <Link to={`/track-order?orderId=${orderId}`} className="btn-primary w-full">Track Your Order</Link>
                        <Link to="/shop" className="btn-secondary w-full">Continue Shopping</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default OrderConfirmationPage;
