import crypto from "crypto"

const generateOtp = () => {
    return crypto.randomInt(100000, 999999)
}

const getOtpHtml = (otp) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification</title>
    </head>
    <body>
        <h1>OTP Verification</h1>
        <p>Your OTP is: ${otp}</p>
        <p>Please use this OTP to verify your email address.</p>
    </body>
    </html>
    `
}

export { generateOtp, getOtpHtml }