const API_KEY = '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';
const API_URL = 'https://api.perplexity.ai/chat/completions';


let state = {
    currentStep: 0,
    prompt: '',
    versions: {
        v1: '',
        v2: '',
        v3: ''
    }
};


const sections = {
    input: document.getElementById('input-section'),
    process: document.getElementById('process-section'),
    result: document.getElementById('result-section')
};

const elements = {
    promptInput: document.getElementById('user-prompt'),
    generateBtn: document.getElementById('generate-btn'),
    consoleLogs: document.getElementById('console-logs'),
    previewFrame: document.getElementById('preview-frame'),
    steps: [
        document.getElementById('step-1'),
        document.getElementById('step-2'),
        document.getElementById('step-3')
    ],
    codeViews: {
        v1: document.getElementById('code-v1'),
        v2: document.getElementById('code-v2'),
        v3: document.getElementById('code-v3')
    },
    modal: document.getElementById('code-history-modal'),
    viewCodeBtn: document.getElementById('view-code-btn'),
    closeModalBtn: document.querySelector('.close-modal'),
    downloadBtn: document.getElementById('download-btn')
};


elements.generateBtn.addEventListener('click', startGeneration);
elements.viewCodeBtn.addEventListener('click', () => elements.modal.classList.add('active'));
elements.closeModalBtn.addEventListener('click', () => elements.modal.classList.remove('active'));
elements.downloadBtn.addEventListener('click', downloadSource);


const accordions = document.getElementsByClassName("accordion");
for (let i = 0; i < accordions.length; i++) {
    accordions[i].addEventListener("click", function () {
        this.classList.toggle("active-accordion");
        const panel = this.nextElementSibling;
        if (panel.style.maxHeight) {
            panel.style.maxHeight = null;
        } else {
            panel.style.maxHeight = panel.scrollHeight + "px";
        }
    });
}


async function startGeneration() {
    const prompt = elements.promptInput.value.trim();
    if (!prompt) {
        alert('Please enter a description for your website.');
        return;
    }

    state.prompt = prompt;
    switchSection('process');

    try {

        const enhancedPrompt = await enhancePrompt(prompt);
        log(`Prompt enhanced!`, 'success');

        log('Starting generation process...', 'info');
        state.versions.v1 = await generateV1(enhancedPrompt);
        elements.codeViews.v1.textContent = state.versions.v1;
        updateStep(0, 'completed');

        updateStep(1, 'active');
        log('Analyzing and refining code structure...', 'info');
        state.versions.v2 = await generateV2(state.versions.v1);
        elements.codeViews.v2.textContent = state.versions.v2;
        updateStep(1, 'completed');

        updateStep(2, 'active');
        log('Applying final design polish and UI enhancements...', 'info');
        state.versions.v3 = await generateV3(state.versions.v2);
        elements.codeViews.v3.textContent = state.versions.v3;
        updateStep(2, 'completed');

        log('Generation complete! Rendering preview...', 'success');
        switchSection('result');
        setTimeout(() => {
            renderPreview(state.versions.v3);
        }, 100);

    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        alert('An error occurred during generation. Please check the console logs.');
    }
}


async function callPerplexity(messages) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'sonar-pro',
            messages: messages,
            temperature: 0.7,
            max_tokens: 16000
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('API Error Details:', errorBody);
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

function extractCode(content) {

    const match = content.match(/```html([\s\S]*?)```/);
    if (match && match[1]) {
        return match[1].trim();
    }

    const matchGeneric = content.match(/```([\s\S]*?)```/);
    if (matchGeneric && matchGeneric[1]) {
        return matchGeneric[1].trim();
    }


    const openMatch = content.match(/```html([\s\S]*)/);
    if (openMatch && openMatch[1]) {
        console.warn('Code block was not closed. Returning truncated content.');
        return openMatch[1].trim();
    }

    return content;
}

async function generateV1(prompt) {
    log('Requesting initial layout from AI...', 'info');
    const systemPrompt = `You are an expert web developer. Create a single-file HTML solution (including internal CSS and JS) for the user's request. 
    Ensure the code is COMPLETE, functional, and uses modern HTML5/CSS3. 
    Do not use external CSS/JS files (except for CDNs like FontAwesome or Google Fonts if needed).
    IMPORTANT: You must provide the FULL code. Do not stop in the middle. If the code is long, simplify the content text but keep the structure complete.
    Return ONLY the code inside a markdown code block.`;

    const content = await callPerplexity([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Build a website with this description: ${prompt}` }
    ]);

    return extractCode(content);
}

async function generateV2(code) {
    log('Improving code quality and structure...', 'info');
    const systemPrompt = `You are a senior code reviewer. Refine the following HTML/CSS/JS code.
    Focus on:
    1. Cleaner code structure and indentation.
    2. Better variable naming and semantic HTML.
    3. Fixing any potential logic errors.
    4. Ensuring responsiveness.
    IMPORTANT: Return the FULL improved code. Do not use placeholders like "<!-- rest of code -->".
    Return the FULL improved code inside a markdown code block.`;

    const content = await callPerplexity([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Here is the code to improve:\n\n${code}` }
    ]);

    return extractCode(content);
}

async function generateV3(code) {
    log('Enhancing UI/UX and aesthetics...', 'info');
    const systemPrompt = `You are a master prompt engineer and elite web developer. Your goal is to take the existing code and the user's original request, and transform it into an ultra-modern, high-performance website.

    Original User Request: "${state.prompt}"

    Instructions:
    1.  **Respect the User's Intent:** The website MUST match the user's original request (e.g., if they asked for a pet shop, keep it a pet shop). Do NOT change the content to a generic portfolio unless the user asked for one.
    2.  **Enhance Design:** Employ the latest advanced CSS techniques (glassmorphism, gradients, 3D transforms, complex hover effects).
    3.  **Polish UI/UX:** Ensure smooth transitions, responsive layout, and a premium feel.
    4.  **Code Quality:** Return a single, complete HTML file with embedded CSS/JS. No external CSS/JS files (except standard CDNs).
    5.  **Completeness:** Return ONLY the complete, ready-to-deploy HTML code inside a markdown code block. Ensure nothing is truncated.

    Do not change the core subject matter of the website. Make it look amazing, but keep it true to the user's idea.`;

    const content = await callPerplexity([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Here is the code to polish:\n\n${code}` }
    ]);

    return extractCode(content);
}

async function enhancePrompt(originalPrompt) {
    const systemPrompt = `You are an expert AI prompt engineer. Your goal is to rewrite the user's raw web design prompt into a detailed, professional, and technically rich prompt that will yield the best possible results from a coding AI.
    
    Add details about:
    - Modern design aesthetics (e.g., glassmorphism, gradients, clean typography).
    - Specific UI components (e.g., hero section, feature grid, contact form).
    - Technical requirements (e.g., responsive design, hover effects, smooth transitions).
    - Color palette suggestions if none provided.
    - add advance css hover effects. 
    - add advance css animations.
    - add advance css transitions.
    - add advance css keyframes.
    - add advance css filters. 
    -add advance css things 
    -make sure the colur code is good and make it premium.
    -make sure make looks website professional and premium.
    -make sure make looks website modern and premium.
    -make sure make looks website responsive and premium.
    -make sure make looks website fast and premium.
    -make sure make looks website secure and premium.
    -make sure make looks website fast and premium.
    -make sure everything works properly 
    -no mistake
    -give full code 
    -make sure website is like no one tell its build by AI
    -make sure website is minimal and premium
    Keep the core intent of the user but make it "premium".
    Return ONLY the enhanced prompt text. Do not add any conversational filler.`;

    const content = await callPerplexity([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Enhance this prompt: "${originalPrompt}"` }
    ]);

    return content.trim();
}


function switchSection(sectionId) {
    Object.values(sections).forEach(el => el.classList.remove('active'));
    sections[sectionId].classList.add('active');
}

function updateStep(index, status) {
    const step = elements.steps[index];
    if (status === 'active') {
        step.classList.add('active');
    } else if (status === 'completed') {
        step.classList.remove('active');
        step.classList.add('completed');
    }
}

function log(message, type = 'info') {
    const div = document.createElement('div');
    div.className = 'log-entry';

    const time = new Date().toLocaleTimeString();
    div.innerHTML = `
        <span class="log-time">[${time}]</span>
        <span class="log-msg ${type}">${message}</span>
    `;

    elements.consoleLogs.appendChild(div);
    elements.consoleLogs.scrollTop = elements.consoleLogs.scrollHeight;
}

function renderPreview(code) {
    const iframe = elements.previewFrame;
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(code);
    doc.close();
}

function downloadSource() {
    const zip = new JSZip();

    zip.file("index.html", state.versions.v3);
    zip.file("README.txt", `Generated by WebGen AI\n\nPrompt: ${state.prompt}\nDate: ${new Date().toLocaleString()}`);

    zip.generateAsync({ type: "blob" })
        .then(function (content) {
            // Create a download link
            const a = document.createElement("a");
            a.href = URL.createObjectURL(content);
            a.download = "website_project.zip";
            a.click();
        });
}
