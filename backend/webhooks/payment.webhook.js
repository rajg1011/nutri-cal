// const verifyPaymentController = async (req, res) => {
//     try {
//         const body = req.body;
//         const verify = await paymentService.verifyPayment(body)
//         if (!verify) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Payment verification failed'
//             })
//         }

//         const { _, error } = await supabaseAdmin.from('userSubscritionsDetails').update({ subscription_status: "CONFIRM" }).eq('user_id', req.user);
//         if (error) {
//             //todo -> DB not updated yet
//             res.status(500).json({ success: true, message: "Money debited" })
//         }
//         return res.status(200).json({ success: true, message: "Subscription Successful" })
//     } catch (e) {
//         console.log(e)
//         return res.status(500).json({ success: false, message: "Internal Server Error" })
//     }
// }