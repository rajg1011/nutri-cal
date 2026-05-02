import { useState } from "react";
import { useRazorpay } from "react-razorpay";
import axios from "axios";
import { toast } from "react-toastify";
import { SUBSCRIPTION_TYPE } from "../../utils/constant";

const createOrder = async (subs, session) => {
    try {
        const url = subs === "PRO" ? 'plan' : 'order'
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

            const { order_id, amount } = orderData;
            const razorPayOptions = {
                key: import.meta.env.VITE_RAZORPAY_API_KEY,
                currency: "INR",
                name: "NutriCal AI",
                amount,
                prefill: {
                    name: user.user_metadata?.full_name || '',
                    email: user.email,
                },
                handler: async (response) => {
                    setIsProcessing(true);
                    if(subscription === Object.keys(SUBSCRIPTION_TYPE)?.[1]) await verifyPayment(response, session);
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
            if (subscription === Object.keys(SUBSCRIPTION_TYPE)?.[1]) {
                razorPayOptions.order_id = order_id
            } else {
                razorPayOptions.subscription_id = import.meta.env.VITE_RAZORPAY_PLAN_ID_199
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