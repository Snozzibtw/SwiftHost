import express from 'express';
import axios from 'axios';
import querystring from 'querystring';
import cookieParser from 'cookie-parser';

const app = express();
app.use(cookieParser());

// Your OAuth2 client credentials
const clientId = '941381287447519302';  // Replace with your Discord client ID
const clientSecret = 'gCSNxtLy8bkwE3gOodGa1LB4NOFZrgmB';  // Replace with your Discord client secret
const redirectUri = 'http://localhost:3000/callback';  // Callback URL

// Your guild ID and client role ID
const guildId = '1359502260811464916';  // Replace with your actual guild ID
const clientRoleID = '1359601052369813504';  // Replace with your actual client role ID

// OAuth2 authentication route
app.get('/login', (_, res) => {
  console.log('Login route hit');
  const scope = encodeURIComponent('identify guilds');
  const authUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;
  res.redirect(authUrl);
});

// OAuth2 callback route
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.send('No code received');

  try {
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', querystring.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token } = tokenResponse.data;

    // Store token in a secure (HTTP-only) cookie
    res.cookie('token', access_token, { httpOnly: true });
    res.redirect('/panel');
  } catch (error) {
    console.error("Error during token exchange:", error.response ? error.response.data : error.message);
    res.send('Error occurred during authentication');
  }
});

// Function to check if the user has the "Client" role
async function checkUserRole(token) {
  try {
    // Get the list of guilds the user is in
    const guildsRes = await axios.get('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Find if the user is part of your guild
    const guild = guildsRes.data.find(g => g.id === guildId);
    if (!guild) return false; // User is not in your guild

    // Get the member information for your guild
    const memberRes = await axios.get(`https://discord.com/api/v10/guilds/${guildId}/members/@me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Check if the user has the desired role
    return memberRes.data.roles.includes(clientRoleID);
  } catch (error) {
    console.error("Error fetching user role:", error.response ? error.response.data : error.message);
    return false;
  }
}

// Protected panel route
app.get('/panel', async (req, res) => {
  const { token } = req.cookies;
  if (!token) return res.redirect('/login');

  const hasClientRole = await checkUserRole(token);

  if (hasClientRole) {
    res.redirect('https://panel.swifthost.cc');  // Redirect to your external panel
  } else {
    res.redirect('/');  // Redirect unauthorized users to the homepage (or another route)
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
