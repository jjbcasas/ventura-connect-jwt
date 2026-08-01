import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { generateToken } from '../config/utils.js'
dotenv.config({ path: './backend/config/.env'})

// Health Check Controller (UpTimeRobot)
export const getCheck = ( req, res ) => {
  return res.status(200).send("Server is alive!")
}

// This endpoint would primarily be used to check if a user is already authenticated
// when the React app loads or navigates to a protected route.
export const getUser = (req, res) => {
  // No need to autheticated. protectRoute middleware already did the authentication and attached the user object to req.user
  console.log('User fetched!')
  return res.status(200).json({
    isAuthenticated: true,
    user: {
      _id: req.user._id,
      userName: req.user.userName,
      email: req.user.email,
      // Include any other non-sensitive user data your frontend needs
      profileImage: req.user.profileImage,
      likedPostId: req.user.likedPostId,
      followingId: req.user.followingId,
      followerId: req.user.followerId,
      stripeAccountId: req.user.stripeAccountId,
      stripeOnboardingComplete: req.user.stripeOnboardingComplete
    },
    message: 'User is already logged in.'
  });
}
  
  // Signup Controller
  export const postSignup = async (req, res, next) => {
    const { userName, email, password } = req.body

    try {
      if ( !userName || !email || !password ) {
        return res.status(400).json({
          message: 'All fields are required'
        })
      }
      
      if ( password.length < 6 ) {
        return res.status(400).json({
          message: 'Password must be at least 6 characters'
        })
      }
      
      // check if email is valid: regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if ( !emailRegex.test(email)) {
        return res.status(400).json({
          message: 'Invalid email format'
        })
      }

      const user = await User.findOne({ email })
      if ( user ) return res.status(400).json({
        message: "Email already exist"
      })

      const newUser = new User({
        userName,
        email,
        password
      })

      const savedUser = await newUser.save();

      if (!savedUser) {
        console.error('Signup failed due to invalid user object structure or failed saving attempt.', {
            reason: 'newUser object was null or undefined.',
            requestBody: req.body // Log the data that caused the failure
        });
        return res.status(400).json({ message: "Invalid user data" });
      }
      
        generateToken(savedUser._id, res)

        // Successful signup
        // Send back user data (e.g., sanitized user object, success message)
        res.status(201).json({ // 201 Created for successful resource creation
          message: 'Signup successful!',
          isAuthenticated: true,
          user: { // Send back relevant user data, e.g., for storing in client-side state
              _id: savedUser._id,
              userName: savedUser.userName,
              email: savedUser.email,
              followerId: savedUser.followerId,
              followingId: savedUser.followingId,
              likedPostId: savedUser.likedPostId,
              stripeAccountId: savedUser.stripeAccountId,
              stripeOnboardingComplete: savedUser.stripeOnboardingComplete
              // ... exclude sensitive info like password
          }
        })

    } catch (error) {
      console.error('Error in signup controller:', error)
      res.status(500).json({
        message: "Internal Server Error"
      })
    }
  }

  // Login Controller
  export const postLogin = async (req, res, next) => {
    const { email, password } = req.body

    if ( !email || !password ) {
      return res.status(400).json({
        message: "Email and password are required"
      })
    }

    try {
      const user = await User.findOne({ email })
      if ( !user ) return res.status(400).json({
        message: "Invalid credentials"
      }) // never tell the client which one is incorrect: password or email

      const isPasswordCorrect = await bcrypt.compare( password, user.password )
      if ( !isPasswordCorrect ) return res.status(400).json({
        message: "Invalid credentials"
      }) // never tell the client which one is incorrect: password or email

      generateToken(user._id, res)

      // Successful signup and login
      console.log('Successful Login')
      res.status(200).json({ // 201 Created for successful resource creation
        message: 'Success! You are logged in.',
        isAuthenticated: true,
        user: { // Send back relevant user data, e.g., for storing in client-side state
            _id: user._id,
            userName: user.userName,
            email: user.email,
            followerId: user.followerId,
            followingId: user.followingId,
            likedPostId: user.likedPostId,
            profileImage: user.profileImage,
            stripeAccountId: user.stripeAccountId,
            stripeOnboardingComplete: user.stripeOnboardingComplete
            // ... exclude sensitive info like password
        }
      })

    } catch (error) {
        console.error("Error in login controller: ", error)
        res.status(500).json({
          message: "Internal Server error"
        })
    }
  }

  // Logout Controller
  export const logout = (_, res ) => {
    res.cookie("jwt", "", { maxAge:0 })
    res.status(200).json({
      message: "Logged out successfully"
    })
  }

  // Google Login Controller
  export const googleLogin = async (req, res) => {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const { token } = req.body; // The token sent from React by Google API

    try {
        // Verify the Google Token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        // Find or Create User in MongoDB
        let user = await User.findOne({ email: payload.email });
        let isNewUser = false;

        if (!user) {
            user = await User.create({
                userName: payload.name,
                email: payload.email,
                profileImage: payload.picture,
                googleId: payload.sub
            });
            isNewUser = true;
        }

        // Generate your OWN JWT
        generateToken( user._id, res )

        res.status( isNewUser ? 201 : 200 ).json({
          message: isNewUser ? 'Successful Google Signup.' : 'Successful Google Login.',
              isAuthenticated: true,
              user: {
                _id: user._id,
                userName: user.userName,
                email: user.email,
                followerId: user.followerId,
                followingId: user.followingId,
                likedPostId: user.likedPostId,
                profileImage: user.profileImage
              }
        });

    } catch (error) {
      console.error("Google Auth Error:", error);
      res.status(400).json({ message: "Google auth failed" });
    }
  };