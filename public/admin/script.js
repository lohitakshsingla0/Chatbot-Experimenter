function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Show the selected section
    const selectedSection = document.getElementById(sectionId);
    selectedSection.classList.add('active');
}

// Show the homepage by default
document.addEventListener('DOMContentLoaded', () => {
    showSection('homepage');
    fetchExperiments();
});

function fetchExperiments() {
    fetch('/experiments')
        .then(response => response.json())
        .then(data => {

            console.log(data)
            const experimentTopic = document.getElementById('experimentTopic');
            const deleteExperimentTopic = document.getElementById('deleteExperimentTopic');
            experimentTopic.innerHTML = '';
            deleteExperimentTopic.innerHTML = '';
            data.experiments.forEach(experiment => {
                const option = document.createElement('option');
                option.value = experiment.title;
                option.textContent = experiment.title;
                experimentTopic.appendChild(option);

                const deleteOption = document.createElement('option');
                deleteOption.value = experiment.title;
                deleteOption.textContent = experiment.title;
                deleteExperimentTopic.appendChild(deleteOption);
            });

            // Trigger change event to populate chatbots
            experimentTopic.dispatchEvent(new Event('change'));
        });
}

// Populate the chatbot list based on the selected experiment topic
document.getElementById('experimentTopic').addEventListener('change', function() {
    const experimentTitle = this.value;
    fetch('/experiments')
        .then(response => response.json())
        .then(data => {
            console.log(data)

            const experiment = data.experiments.find(exp => exp.title === experimentTitle);
            const chatbotList = document.getElementById('chatbotList');
            chatbotList.innerHTML = '';

            experiment.chatbots.forEach(chatbot => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.textContent = chatbot.name;
                li.dataset.link = chatbot.link; // Store the link in a data attribute
                chatbotList.appendChild(li);
            });
        });
});

document.getElementById('uploadFile').addEventListener('change', function() {
    const fileInput = this;
    const file = fileInput.files[0];

    if (!file) {
        alert("Please upload an Excel file.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonSheet = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const emailColumnIndex = jsonSheet[0].indexOf('email');
        if (emailColumnIndex === -1) {
            alert("Email column not found in the Excel file.");
            return;
        }

        const emails = jsonSheet.slice(1).map(row => row[emailColumnIndex]).filter(email => email);
        document.getElementById('emailList').value = emails.join(', ');
    };
    reader.readAsArrayBuffer(file);
});

function processAndSendEmails() {
    const experimentTopic = document.getElementById('experimentTopic').value;
    const emails = document.getElementById('emailList').value.split(',').map(email => email.trim()).filter(email => email);

    if (emails.length === 0) {
        alert("No emails found. Please upload a valid Excel file.");
        return;
    }

    fetch('/experiments')
        .then(response => response.json())
        .then(data => {
            const experiment = data.experiments.find(exp => exp.title === experimentTopic);
            const selectedLinks = experiment.chatbots.map(chatbot => chatbot.link);
            console.log(emails)
            console.log(selectedLinks)
            distributeChatbotsAndSendEmails(emails, selectedLinks);
        });
}

function distributeChatbotsAndSendEmails(emails, selectedLinks) {
    // Shuffle emails to distribute chatbots randomly
    emails = emails.sort(() => Math.random() - 0.5);

    // Distribute chatbots equally among users
    emails.forEach((email, index) => {
        const selectedLink = selectedLinks[index % selectedLinks.length];

        // Log the email and link for debugging
        console.log(`Sending email to ${email} with the link: ${selectedLink}`);

        // Send email using the backend API
        fetch('/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                link: selectedLink,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    console.log(`Email sent to ${email}`);
                } else {
                    console.log(`Failed to send email to ${email}`);
                }
            })
            .catch((error) => {
                console.error(`Error sending email to ${email}:`, error);
            });
    });

    alert('Emails have been sent successfully.');
}



// function distributeChatbotsAndSendEmails(emails, selectedLinks) {
//     // Shuffle the emails
//     emails = emails.sort(() => Math.random() - 0.5);

//     // Distribute chatbots equally
//     emails.forEach((email, index) => {
//         const selectedLink = selectedLinks[index % selectedLinks.length];

//         // This is a placeholder for the actual email sending functionality
//         console.log(`Sending email to ${email} with the link: ${selectedLink}`);

//         // Optionally, you can use a backend service to send the email
//         // Example:
//         fetch('/send-email', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify({
//                 email: email,
//                 link: selectedLink
//             })
//         }).then(response => response.json())
//           .then(data => {
//               if (data.success) {
//                   console.log(`Email sent to ${email}`);
//               } else {
//                   console.log(`Failed to send email to ${email}`);
//               }
//           });
//     });

//     alert("Emails have been sent successfully.");
// }

function generateChatbotFields() {
    const numChatbots = document.getElementById('numChatbots').value;
    const container = document.getElementById('chatbotFieldsContainer');
    container.innerHTML = '';

    for (let i = 1; i <= numChatbots; i++) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        const label = document.createElement('label');
        label.textContent = `Chatbot ${i} Link`;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control';
        input.id = `chatbotLink${i}`;
        input.placeholder = `Enter link for Chatbot ${i}`;
        input.required = true;

        formGroup.appendChild(label);
        formGroup.appendChild(input);
        container.appendChild(formGroup);
    }

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'btn btn-primary btn-block';
    addButton.textContent = 'Add Experiment and Chatbots';
    addButton.onclick = addUsecase;

    container.appendChild(addButton);
}

function addUsecase() {
    const title = document.getElementById('usecaseTitle').value;
    const numChatbots = document.getElementById('numChatbots').value;
    const chatbots = [];

    for (let i = 1; i <= numChatbots; i++) {
        const link = document.getElementById(`chatbotLink${i}`).value;
        if (!link) {
            alert(`Please enter a link for Chatbot ${i}`);
            return;
        }
        chatbots.push({ name: `Chatbot ${i}`, link });
    }

    // This is a placeholder for the actual use case addition functionality
    console.log(`Adding experiment with title: ${title}`);
    console.log(`Chatbots: `, chatbots);

    // Optionally, you can use a backend service to save the experiment and chatbots
    fetch('/add-experiment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title,
            chatbots
        })
    }).then(response => response.json())
      .then(data => {
          if (data.success) {
              alert('Experiment and chatbots added successfully');
              // Reset the form
              document.getElementById('usecaseForm').reset();
              document.getElementById('chatbotFieldsContainer').innerHTML = '';
              fetchExperiments();  // Refresh the experiments dropdown
          } else {
              alert('Failed to add experiment and chatbots');
          }
      });
}

function deleteExperiment() {
    const experimentTitle = document.getElementById('deleteExperimentTopic').value;
    if (!experimentTitle) {
        alert("Please select an experiment to delete.");
        return;
    }

    if (!confirm(`Are you sure you want to delete the experiment "${experimentTitle}"? This action cannot be undone.`)) {
        return;
    }

    fetch(`/delete-experiment/${experimentTitle}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => response.json())
      .then(data => {
          if (data.success) {
              alert('Experiment deleted successfully');
              fetchExperiments();  // Refresh the experiments dropdown
          } else {
              alert('Failed to delete experiment');
          }
      });
}
