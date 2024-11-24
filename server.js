const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(bodyParser.json());

// Store experiments in memory for simplicity (you can use a database or file for persistence)
const experimentsFilePath = path.join(__dirname, 'experiments.json');

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: 'chatbotexperimenter@gmail.com', // Replace with your email
      pass: 'Experimenter@123' // Replace with your email password or app password
  }
});

// Ensure the experiments.json file exists
if (!fs.existsSync(experimentsFilePath)) {
    fs.writeFileSync(experimentsFilePath, JSON.stringify({ experiments: [] }, null, 2));
}



//Test
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Routes for different chat interfaces
app.get('/comparison/full-screen', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'comparison', 'full-screen', 'index.html'));
});

app.get('/comparison/small-screen', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'comparison', 'small-screen', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Orders data
let orders = [
    {
      id: '12345',
      status: 'Shipped',
      delivery: '3-5 days',
      items: [
        { name: 'Item 1', quantity: 2, image: '/images/summerDress1.avif' }
      ]
    },
    {
      id: '67890',
      status: 'Processing',
      delivery: '5-7 days',
      items: [
        { name: 'Item 4', quantity: 3, image: '/images/summerDress2.webp' }
      ]
    },
    {
        id: '67891',
        status: 'Cancelled',
        delivery: '5-7 days',
        items: [
          { name: 'Item 4', quantity: 3, image: '/images/dress5.webp' }
        ]
    },
    {
        id: '67892',
        status: 'Returned',
        delivery: '5-7 days',
        items: [
          { name: 'Item 4', quantity: 3, image: '/images/dress4.avif' }
        ]
    },
    {
        id: '67893',
        status: 'Processing',
        delivery: '5-7 days',
        items: [
          { name: 'Item 4', quantity: 3, image: '/images/dress3.avif' }
        ]
    }
  ];

  // Example currentContext object to maintain conversation state
let currentContext = {
    action: null // Initialize action as null
};

   // Helper functions for order actions
   function trackOrder() {
    let botResponse = "You have the following orders:<br>";
    orders.filter(order => order.status === 'Processing' || order.status === 'Shipped').forEach(order => {
      botResponse += `<div><img src="${order.items[0].image}" alt="order image" style="width:100px;height:100px;"> Order ID: ${order.id} <br> Status: ${order.status}</div>`;
    });
    botResponse += "<br>Please enter the order ID to track.";
    currentContext.action = "track";
    return botResponse;
  }

  function cancelOrder() {
    let botResponse = "You have the following orders:<br>";
    orders.filter(order => order.status === 'Processing' || order.status === 'Shipped').forEach(order => {
      botResponse += `<div><img src="${order.items[0].image}" alt="order image" style="width:100px;height:100px;"> Order ID: ${order.id}  <br> Status: ${order.status}</div>`;
    });
    botResponse += "<br>Please enter the order ID to cancel.";
    currentContext.action = "cancel";
    return botResponse;
  }

  function returnOrder() {
    let botResponse = "You have the following orders:<br>";
    orders.filter(order => order.status === 'Processing' || order.status === 'Shipped').forEach(order => {
      botResponse += `<div><img src="${order.items[0].image}" alt="order image" style="width:100px;height:100px;"> Order ID: ${order.id}  <br> Status: ${order.status}</div>`;
    });
    botResponse += "<br>Please enter the order ID to return.";
    currentContext.action = "return";
    return botResponse;
  }

  function checkRefundStatus() {
    let botResponse = "You have the following orders which are cancelled or returned and available for refund status:<br>";
    orders.filter(order => order.status === 'Cancelled' || order.status === 'Returned').forEach(order => {
      botResponse += `<div><img src="${order.items[0].image}" alt="order image" style="width:100px;height:100px;"> Order ID: ${order.id}  <br> Status: ${order.status}</div>`;
    });
    botResponse += "<br>Please enter the order ID to check the refund status.";
    currentContext.action = "refund";
    return botResponse;
  }

//   function exchangeOrder() {
//     let botResponse = "You have the following orders:<br>";
//     orders.forEach(order => {
//       botResponse += `<div><img src="${order.items[0].image}" alt="order image" style="width:100px;height:100px;"> Order ID: ${order.id}  <br> Status: ${order.status}</div>`;
//     });
//     botResponse += "<br>Please enter the order ID to exchange and the item you wish to exchange.";
//     currentContext.action = "exchange";
//     return botResponse;
//   }

  function handleOrderAction(order) {
    let botResponse = "";

    switch (currentContext.action) {
      case "track":
        botResponse = `Order ID: ${order.id} - Status: ${order.status} - Estimated Delivery: ${order.delivery}`;
        break;
      case "cancel":
        botResponse = `Order ID: ${order.id} has been canceled.`;
        break;
      case "return":
        botResponse = `Order ID: ${order.id} has been processed for return.`;
        break;
      case "refund":
        botResponse = `Order ID: ${order.id} - Refund status: In Progress`;
        break;
      case "exchange":
        botResponse = `Order ID: ${order.id} has been processed for exchange.`;
        break;
      default:
        botResponse = "I'm not sure how to respond to that regarding the order.";
    }
    return botResponse;
  }

  // Process message function
  function processMessage(message) {
    const lowerCaseMessage = message.toLowerCase();
    let botResponse = "I'm not sure how to respond to that. Could you please clarify your request?";

    if (lowerCaseMessage.includes("track")) {
      botResponse = trackOrder();
    } else if (lowerCaseMessage.includes("cancel")) {
      botResponse = cancelOrder();
    } else if (lowerCaseMessage.includes("return")) {
      botResponse = returnOrder();
    } else if (lowerCaseMessage.includes("refund status") || lowerCaseMessage.includes("refund")) {
      botResponse = checkRefundStatus();
    } else if (lowerCaseMessage.includes("exchange")) {
      botResponse = "For exhanging you order, you need to first cancel the current order and then order it again from the website. Thanks for your understanding.";
    } else if (lowerCaseMessage.includes("hi") || lowerCaseMessage.includes("hello")) {
      botResponse = "Hello! How can I assist you today?";
    } else if (lowerCaseMessage.includes("bye")) {
      botResponse = "Goodbye! Have a great day!";
    } else if (lowerCaseMessage.includes("thanks") || lowerCaseMessage.includes("thank you")) {
      botResponse = "You're welcome! If you need any further assistance, feel free to ask.";
    } else if (lowerCaseMessage.includes("contact customer care")) {
      botResponse = "You can contact our customer care team at support@example.com or call +123-456-7890 for further assistance.";
    } else if (lowerCaseMessage.includes("how are you")) {
      botResponse = "I'm just a bot, but I'm here to help you with your order queries!";
    } else if (lowerCaseMessage.includes("help")) {
      botResponse = "I can help you with tracking orders, checking statuses, cancellations, returns, refunds,. What do you need assistance with?";
    } else if (currentContext.action) {
      console.log("inside current Context")
      const orderId = message.match(/\b\d{5}\b/);
      console.log("orderID:" + orderId)
      if (orderId) {
        const order = orders.find(order => order.id === orderId[0]);
        if (order) {
          botResponse = handleOrderAction(order);
          currentContext.action = null;
        } else {
          botResponse = "Sorry, I couldn't find that order ID. Please try again.";
        }
      } else {
        botResponse = "Please enter a valid order ID.";
      }
    }
    return botResponse;
  }

  function convertToKebabCase(input) {
    return input
        .toLowerCase()          // Convert the entire string to lowercase
        .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric characters (excluding hyphen) with hyphen
        .replace(/(^-|-$)/g, '');     // Remove leading or trailing hyphen if any
}

// Endpoint to serve orders
app.get('/orders', (req, res) => {
    console.log(orders);
    res.json({ orders }); // Respond with JSON object containing orders array
  });

  // POST endpoint to process messages
app.post('/process-message', (req, res) => {
    const message = req.body.message; // Assuming message is sent in the request body
    const botResponse = processMessage(message);
    res.json({ response: `${botResponse}` });
  });

  app.post('/add-experiment', (req, res) => {
    const { title, chatbots } = req.body;
    let titleChatbot = convertToKebabCase(title);
    const experimentPath = path.join(__dirname, 'public', titleChatbot);
    if (!fs.existsSync(experimentPath)) {
        fs.mkdirSync(experimentPath, { recursive: true });

        chatbots.forEach((chatbot, index) => {
            const chatbotPath = path.join(experimentPath, `Chatbot${index + 1}`);
            fs.mkdirSync(chatbotPath, { recursive: true });

            // Create default HTML, CSS, and JS files
            fs.writeFileSync(path.join(chatbotPath, 'index.html'), '<!DOCTYPE html>\n<html>\n<head>\n<title>Chatbot</title>\n<link rel="stylesheet" href="style.css">\n</head>\n<body>\n<script src="script.js"></script>\n</body>\n</html>');
            fs.writeFileSync(path.join(chatbotPath, 'style.css'), 'body { font-family: Arial, sans-serif; }');
            fs.writeFileSync(path.join(chatbotPath, 'script.js'), 'console.log("Chatbot script loaded.");');
        });

        let experiments = JSON.parse(fs.readFileSync(experimentsFilePath, 'utf8'));
        experiments.experiments.push({ title, chatbots });
        fs.writeFileSync(experimentsFilePath, JSON.stringify(experiments, null, 2));

        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Experiment already exists' });
    }
});

app.get('/experiments', (req, res) => {
  const experiments = JSON.parse(fs.readFileSync(experimentsFilePath, 'utf8'));
    res.json(experiments);
});

app.delete('/delete-experiment/:title', (req, res) => {
  const { title } = req.params;
  let experiments = JSON.parse(fs.readFileSync(experimentsFilePath, 'utf8'));

  const experimentIndex = experiments.experiments.findIndex(exp => exp.title === title);
  if (experimentIndex !== -1) {
      experiments.experiments.splice(experimentIndex, 1);
      fs.writeFileSync(experimentsFilePath, JSON.stringify(experiments, null, 2));

      // Remove the directory if it exists
      let titleChatbot = convertToKebabCase(title);
      const experimentPath = path.join(__dirname, 'public', titleChatbot)
      if (fs.existsSync(experimentPath)) {
          fs.rmdirSync(experimentPath, { recursive: true });
      }

      res.json({ success: true });
  } else {
      res.json({ success: false, message: 'Experiment not found' });
  }
});

app.post('/send-email', (req, res) => {
  const { email, link } = req.body;
  emailTest = 'sharyupatilvit@gmail.com'

  const mailOptions = {
      from: 'chatbotexperimenter@gmail.com', // Replace with your email
      to: emailTest,
      subject: 'Experiment Link',
      text: `Please try the following link: ${link}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          return res.json({ success: false, message: error.message });
      }
      res.json({ success: true, message: 'Email sent: ' + info.response });
  });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
