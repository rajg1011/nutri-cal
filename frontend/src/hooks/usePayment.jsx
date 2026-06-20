import { useState } from "react";
import { useRazorpay } from "react-razorpay";
import axios from "axios";
import { toast } from "react-toastify";
import { SUBSCRIPTION_TYPE_PRO, SUBSCRIPTION_TYPE_QUESTION } from "../../utils/constant";

const createOrder = async (subs, session) => {
    try {
        const url = subs === SUBSCRIPTION_TYPE_PRO ? 'plan' : 'order'
        const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/payment/${url}`, { subscription: subs }, {
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
        const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/payment/verify`, payload, {
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
    const [isProcessing, setIsProcessing] = useState(false);

    const pay = async (subscription) => {
        if (!Razorpay) {
            toast.error("Payment SDK not loaded");
            return;
        }

        setIsProcessing(true);
        try {
            const orderData = await createOrder(subscription, session);
            if (!orderData) {
                setIsProcessing(false);
                return;
            }

            const razorPayOptions = {
                key: import.meta.env.VITE_RAZORPAY_API_KEY,
                currency: "INR",
                name: "NutriCal AI",
                prefill: {
                    name: user.user_metadata?.full_name || '',
                    email: user.email,
                },
                handler: async (response) => {
                    setIsProcessing(true);
                    if(subscription === SUBSCRIPTION_TYPE_QUESTION) await verifyPayment(response, session);
                    setIsProcessing(false);
                },
                modal: {
                    ondismiss: () => {
                        setIsProcessing(false);
                    }
                },
                theme: {
                    color: "#21b86d",
                }
            }
            if (subscription === SUBSCRIPTION_TYPE_QUESTION) {
                razorPayOptions.order_id = orderData?.order_id;
                razorPayOptions.amount= orderData?.amount;
            } else {
                razorPayOptions.subscription_id = orderData?.subscription_id
            }

            const razorpayInstance = new Razorpay(razorPayOptions);

            razorpayInstance.open();
            setIsProcessing(false);
        } catch (err) {
            console.error("Payment error:", err);
            toast.error("Failed to initiate payment");
            setIsProcessing(false);
        }
    };

    return { pay, error, isLoading: isProcessing, isSDKLoading: isLoading };
};