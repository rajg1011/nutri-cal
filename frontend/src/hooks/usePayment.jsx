import { useRazorpay } from "react-razorpay";
import axios from "axios";
import { toast } from "react-toastify";

const createOrder = async (subs, session) => {
    try {
        const { data } = await axios.post(`http://localhost:3000/payment/order`, { subscription: subs }, {
            headers: {
                Authorization: `Bearer ${session.access_token}`
            }
        });
        return data;
    } catch (error) {
        toast.error("Something went wrong");
        return null;
    }
}

const verifyPayment = async (response, session) => {
    try {
        const payload = {
            order_id: response.razorpay_order_id,
            payment_id: response.razorpay_payment_id,
            signature: response.razorpay_signature
        };
        const { data } = await axios.post(`http://localhost:3000/payment/verify`, payload, {
            headers: {
                Authorization: `Bearer ${session.access_token}`
            }
        });
        if (data.success) {
            toast.success("Congrats.. U can now use NutriCal AI")
        } else {
            toast.error("Error.. Mail at rajg11680@gmail.com")
        }
    } catch (error) {
        toast.error("Something went wrong");
    }
}

export const usePayment = ({ user, session }) => {
    const { error, isLoading, Razorpay } = useRazorpay();

    const pay = async (subscription) => {
        if (!Razorpay) {
            toast.error("Payment SDK not loaded");
            return;
        }

        const orderData = await createOrder(subscription, session);
        if (!orderData) return;

        const { order_id, amount } = orderData;

        const razorpayInstance = new Razorpay({
            key: import.meta.env.VITE_RAZORPAY_API_KEY,
            order_id,
            currency: "INR",
            name: "NutriCal AI",
            amount,
            prefill: {
                name: user.user_metadata?.full_name || '',
                email: user.email,
            },
            handler: (response) => verifyPayment(response, session),
            theme: {
                color: "#21b86d",
            }
        });

        razorpayInstance.open();
    };

    return { pay, error, isLoading };
};