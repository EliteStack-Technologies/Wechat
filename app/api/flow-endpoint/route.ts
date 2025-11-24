import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse the request body
    const body = await request.json();
    console.log('Received data from flow:', body);

    const { screen_id, data } = body;
    const { flow_token, flow_cta } = body;
    console.log("flow_token", flow_token);
    console.log("flow_cta", flow_cta);

    // 2. Handle the different screens of your flow
    if (screen_id === 'SIGN_IN') {
      const { email, password } = data;

      // TODO: Implement your sign-in logic here
      // For example: Authenticate user against your database
      // Let's assume a simple check for demonstration purposes
      if (email === 'test@example.com' && password === 'password123') {
        // Successful sign-in
        return NextResponse.json({
          version: '7.2',
          screen: 'SIGN_IN', // Keep them on the same screen to show success
          data: {
            // Optional: you can pass a success message back
            status_message: "Sign in successful! Redirecting...",
          },
          action: {
            "name": "navigate",
            "next_screen": "SUCCESS_SCREEN" // You need to define this screen in your flow JSON
          }
        });
      } else {
        // Failed sign-in
        return NextResponse.json({
          version: '7.2',
          screen: 'SIGN_IN',
          data: {
            email_error: "Invalid email or password.",
          },
        });
      }
    } else if (screen_id === 'SIGN_UP') {
      // const { first_name, last_name, email, password, confirm_password, terms_agreement, offers_acceptance } = data;
      const { password, confirm_password } = data;

      // TODO: Implement your sign-up logic here
      // For example:
      // - Validate inputs (e.g., password matches confirm_password)
      // - Check if email already exists in your database
      // - Create a new user account
      console.log("Sign up data:", data);
      
      if (password !== confirm_password) {
          return NextResponse.json({
              version: '7.2',
              screen: 'SIGN_UP',
              data: {
                  password_error: "Passwords do not match."
              }
          });
      }

      console.log("Sign up successful!");

      // If sign-up is successful
      return NextResponse.json({
        version: '7.2',
        screen: 'SIGN_UP',
        data: {
          status_message: "Sign up successful! Please check your email."
        }
      });
    }

    // 3. Handle any other screens or default responses
    return NextResponse.json({
      version: '7.2',
      screen: screen_id,
      data: {
        status_message: "Thank you for your submission!"
      }
    });

  } catch (error) {
    console.error('Error processing flow data:', error);
    // Return a generic error response to the user
    return NextResponse.json({
      version: '7.2',
      screen: 'SIGN_IN',
      data: {
        error_message: "An unexpected error occurred. Please try again later."
      }
    });
  }
}