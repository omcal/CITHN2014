import { getGeminiModel } from '../utils/geminiClient.js';
import ContentProject from '../models/contentProjectModel.js';
import User from '../models/userModel.js';
import { getTrendingKeywords, getRelatedTopics } from '../services/trendsService.js';
import asyncHandler from '../middleware/asyncHandler.js';

// Helper function to update user statistics
const updateUserStats = async (userId, projectType) => {
  try {
    console.log('Updating user stats for:', userId, 'project type:', projectType);
    
    const updateObj = {
      $inc: {
        'stats.totalProjects': 1
      },
      $set: {
        'stats.lastActiveAt': new Date()
      }
    };

    // Increment specific project type counter
    switch (projectType) {
      case 'content-drafting':
        updateObj.$inc['stats.contentDrafts'] = 1;
        break;
      case 'content-modification':
        updateObj.$inc['stats.contentModifications'] = 1;
        break;
      case 'image-prompt':
        updateObj.$inc['stats.imagePrompts'] = 1;
        break;
    }

    const result = await User.findByIdAndUpdate(userId, updateObj, { new: true });
    console.log('User stats updated successfully. New stats:', result.stats);
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
};

// Content Drafting
export const createContentDraft = asyncHandler(async (req, res) => {
  const {
    title,
    location,
    language,
    tone,
    category,
    contentIntent,
    desiredLength
  } = req.body;

  if (!title || !location || !language || !tone || !category || !contentIntent) {
    res.status(400);
    throw new Error('Missing required fields');
  }

  let project;

  try {
    // Create project record
    project = new ContentProject({
      user: req.user._id,
      title,
      projectType: 'content-drafting',
      location,
      language,
      tone,
      category,
      contentIntent,
      desiredLength: desiredLength || '300-400 words',
      status: 'generating'
    });

    await project.save();

    // Get trending keywords
    const trendingKeywords = await getTrendingKeywords(category, location);
    const relatedTopics = await getRelatedTopics(category, location);

    // Update project with trending data
    project.trendingKeywords = trendingKeywords;
    await project.save();

    // Generate content using Gemini AI
    const geminiModel = getGeminiModel();
    
    const trendKeywordsText = trendingKeywords.map(k => k.keyword).join(', ');
    const relatedTopicsText = relatedTopics.map(t => t.topic).join(', ');
    
    const prompt = `
Create a ${tone} ${contentIntent} content piece in ${language} for the ${category} category targeting ${location}.

Content Requirements:
- Length: ${desiredLength || '300-400 words'}
- Tone: ${tone}
- Target Location: ${location}
- Language: ${language}
- Category: ${category}

Trending Keywords to Include: ${trendKeywordsText}
Related Topics to Consider: ${relatedTopicsText}

Please create engaging, high-quality content that incorporates these trending elements naturally. The content should be optimized for e-commerce and marketing purposes.

Content Intent: ${contentIntent}
`;

    let generatedContent;
    
    try {
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      generatedContent = response.text();
    } catch (apiError) {
      console.log('Gemini API failed, using fallback content generation...');
      
      // Fallback content generation
      generatedContent = `
# ${title}

Are you looking for the perfect ${category} solution? Look no further! Our premium ${category} products are designed with ${location} customers in mind.

## Why Choose Our ${category} Products?

${trendKeywordsText.split(', ').map(keyword => 
  `• **${keyword.charAt(0).toUpperCase() + keyword.slice(1)}**: Top-quality ${keyword} that meets your needs`
).join('\n')}

## Perfect for ${location} Market

Our ${tone} approach ensures that every product delivers exceptional value. Whether you're a professional or enthusiast, our ${category} selection offers:

- Premium quality and reliability
- Cutting-edge features and technology  
- Designed specifically for ${language}-speaking customers
- Optimized for the ${location} market

${contentIntent}

**Ready to experience the difference?** Contact us today to learn more about our ${category} solutions!

---
*This content incorporates trending keywords: ${trendKeywordsText}*
      `.trim();
      
    }

    // Update project with generated content
    project.generatedContent = generatedContent;
    project.status = 'completed';
    await project.save();

    // Update user statistics
    await updateUserStats(req.user._id, 'content-drafting');

    res.json({
      success: true,
      project: project,
      trendingKeywords,
      relatedTopics
    });

  } catch (error) {
    console.error('Content drafting error:', error);
    
    // Update project status to failed
    if (project) {
      project.status = 'failed';
      await project.save();
    }
    
    res.status(500);
    throw new Error('Failed to generate content draft');
  }
});

// Content Modification
export const modifyContent = asyncHandler(async (req, res) => {
  const {
    title,
    location,
    language,
    tone,
    category,
    originalContent,
    modificationType
  } = req.body;

  if (!title || !location || !language || !tone || !category || !originalContent || !modificationType) {
    res.status(400);
    throw new Error('Missing required fields');
  }

  let project;

  try {
    // Create project record
    project = new ContentProject({
      user: req.user._id,
      title,
      projectType: 'content-modification',
      location,
      language,
      tone,
      category,
      originalContent,
      modificationType,
      status: 'generating'
    });

    await project.save();

    // Get trending keywords for context
    const trendingKeywords = await getTrendingKeywords(category, location);
    project.trendingKeywords = trendingKeywords;
    await project.save();

    // Generate modified content using Gemini AI
    const geminiModel = getGeminiModel();
    
    const trendKeywordsText = trendingKeywords.map(k => k.keyword).join(', ');
    
    let modificationInstruction = '';
    switch (modificationType) {
      case 'elaborate':
        modificationInstruction = 'Expand and elaborate on the following content with richer details, more examples, and deeper insights. Make it more comprehensive and engaging.';
        break;
      case 'summarize':
        modificationInstruction = 'Summarize the following content into a concise, clear, and impactful summary that captures the key points.';
        break;
      case 'rephrase':
        modificationInstruction = `Rephrase the following content to match a ${tone} tone while maintaining the original meaning and improving clarity.`;
        break;
      default:
        modificationInstruction = 'Improve the following content while maintaining its core message.';
    }

    const prompt = `
${modificationInstruction}

Content Details:
- Target Location: ${location}
- Language: ${language}
- Desired Tone: ${tone}
- Category: ${category}
- Current Trending Keywords: ${trendKeywordsText}

Original Content:
"${originalContent}"

Please ${modificationType} this content while naturally incorporating relevant trending keywords and maintaining the ${tone} tone for the ${category} category in ${location}.
`;

    let generatedContent;
    
    try {
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      generatedContent = response.text();
      console.log('Content modification successful via Gemini AI');
    } catch (apiError) {
      console.log('Gemini API failed, using fallback content modification...');
      
      // Fallback content modification based on type
      switch (modificationType) {
        case 'elaborate':
          generatedContent = `${originalContent}

**Enhanced Details:**

Building upon the original content, here's a more comprehensive perspective tailored for the ${location} market. Our ${tone} approach ensures that ${category} enthusiasts in ${location} receive the most relevant information.

**Key Features & Benefits:**
${trendingKeywords.map(keyword => 
  `• **${keyword.keyword.charAt(0).toUpperCase() + keyword.keyword.slice(1)}**: Enhanced functionality that delivers superior performance and value`
).join('\n')}

**Market-Specific Advantages:**
- Optimized for ${language}-speaking customers
- Designed with ${location} preferences in mind
- Incorporates latest ${category} trends and innovations
- Provides exceptional user experience and reliability

**Professional Recommendation:**
Based on current market trends and customer feedback in ${location}, this solution represents an excellent choice for those seeking quality ${category} options. The combination of advanced features and user-friendly design makes it particularly suitable for the ${language} market.

*Enhanced with trending insights: ${trendingKeywords.map(k => k.keyword).join(', ')}*`;
          break;

        case 'summarize':
          generatedContent = `**${category.charAt(0).toUpperCase() + category.slice(1)} Summary for ${location}:**

${originalContent.split('.')[0]}. Key highlights include ${trendingKeywords.slice(0, 2).map(k => k.keyword).join(' and ')}, making it ideal for ${language}-speaking customers.

**Quick Benefits:** Premium quality, ${tone} design, and optimized for the ${location} market.

*Summary based on trending: ${trendingKeywords.map(k => k.keyword).join(', ')}*`;
          break;

        case 'rephrase':
          const sentences = originalContent.split('.').filter(s => s.trim());
          generatedContent = sentences.map(sentence => {
            if (sentence.includes('good')) {
              return sentence.replace('good', 'excellent').replace('decent', 'outstanding');
            }
            return sentence.charAt(0).toUpperCase() + sentence.slice(1).trim();
          }).join('. ') + '.';
          
          generatedContent += `\n\n**Enhanced for ${location}:** This ${tone} description incorporates current ${category} trends including ${trendingKeywords.slice(0, 2).map(k => k.keyword).join(' and ')}, ensuring relevance for ${language}-speaking customers.

*Rephrased with trending insights: ${trendingKeywords.map(k => k.keyword).join(', ')}*`;
          break;

        default:
          generatedContent = originalContent;
      }
      
      console.log('Fallback content modification generated, length:', generatedContent.length);
    }

    // Update project with generated content
    project.generatedContent = generatedContent;
    project.status = 'completed';
    await project.save();

    // Update user statistics
    await updateUserStats(req.user._id, 'content-modification');

    res.json({
      success: true,
      project: project,
      trendingKeywords,
      originalContent,
      modifiedContent: generatedContent
    });

  } catch (error) {
    console.error('Content modification error:', error);
    
    if (project) {
      project.status = 'failed';
      await project.save();
    }
    
    res.status(500);
    throw new Error('Failed to modify content');
  }
});

// Image Prompt Generation
export const generateImagePrompt = asyncHandler(async (req, res) => {
  const {
    title,
    location,
    language,
    tone,
    category,
    baseContent,
    visualStyle
  } = req.body;

  if (!title || !location || !language || !tone || !category || !baseContent) {
    res.status(400);
    throw new Error('Missing required fields');
  }

  let project;

  try {
    // Create project record
    project = new ContentProject({
      user: req.user._id,
      title,
      projectType: 'image-prompt',
      location,
      language,
      tone,
      category,
      originalContent: baseContent,
      visualStyle: visualStyle || 'minimalistic, high-contrast background',
      status: 'generating'
    });

    await project.save();

    // Get trending keywords for context
    const trendingKeywords = await getTrendingKeywords(category, location);
    project.trendingKeywords = trendingKeywords;
    await project.save();

    // Generate image prompt using Gemini AI
    const geminiModel = getGeminiModel();
    
    const prompt = `
Create a detailed image generation prompt based on the following content and specifications:

Content: "${baseContent}"

Specifications:
- Category: ${category}
- Tone: ${tone}
- Target Location: ${location}
- Visual Style: ${visualStyle || 'minimalistic, high-contrast background'}

Requirements for the image prompt:
1. Create a detailed prompt suitable for AI image generation tools (like DALL-E, Midjourney, or SORA)
2. Include specific visual elements that align with the ${category} category
3. Incorporate the ${tone} tone through visual elements (colors, composition, mood)
4. Consider ${location} cultural preferences and market expectations
5. Ensure the prompt results in professional, marketing-ready visuals
6. Include technical specifications like lighting, composition, and style details

Generate a comprehensive image prompt that will create visuals perfectly aligned with the content and brand voice.
`;

    let imagePrompt;
    
    try {
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      imagePrompt = response.text();
      console.log('Image prompt generation successful via Gemini AI');
    } catch (apiError) {
      console.log('Gemini API failed, using fallback image prompt generation...');
      
      // Fallback image prompt generation
      const trendKeywordsText = trendingKeywords.map(k => k.keyword).join(', ');
      
      imagePrompt = `**Professional ${category.charAt(0).toUpperCase() + category.slice(1)} Image Prompt:**

Create a high-quality, professional image featuring ${baseContent.toLowerCase().replace(/[.!?]+$/, '')}. 

**Visual Style:** ${visualStyle}

**Composition Guidelines:**
- Primary focus: Main subject with clear, detailed presentation
- Background: ${visualStyle.includes('minimalistic') ? 'Clean, uncluttered background' : visualStyle.includes('luxury') ? 'Premium, elegant backdrop' : 'Professional, well-lit environment'}
- Lighting: Soft, even lighting that highlights key features
- Color palette: ${tone === 'professional' ? 'Neutral tones with accent colors' : tone === 'friendly' ? 'Warm, inviting colors' : 'Colors appropriate for ' + tone + ' tone'}

**Market-Specific Elements for ${location}:**
- Cultural preferences: Consider ${location} aesthetic standards
- Language considerations: Any text should be in ${language}
- Regional style: Incorporate ${location} market preferences

**Trending Elements to Include:**
${trendingKeywords.map(keyword => 
  `- ${keyword.keyword.charAt(0).toUpperCase() + keyword.keyword.slice(1)}: Subtly incorporate visual elements related to this trending topic`
).join('\n')}

**Technical Specifications:**
- Resolution: High-definition (minimum 1920x1080)
- Format: Professional commercial photography style
- Perspective: ${category === 'fashion' ? 'Model or lifestyle photography angle' : category === 'electronics' ? 'Product photography with detail shots' : 'Appropriate angle for ' + category + ' presentation'}
- Quality: Commercial-grade, marketing-ready imagery

**Final Note:** Ensure the image conveys ${tone} messaging and appeals to ${language}-speaking customers in ${location}. The visual should enhance the content message while incorporating trending elements: ${trendKeywordsText}.

*Generated for ${category} category targeting ${location} market with trending insights: ${trendKeywordsText}*`;
      
      console.log('Fallback image prompt generated, length:', imagePrompt.length);
    }

    // Update project with generated prompt
    project.generatedContent = imagePrompt;
    project.status = 'completed';
    await project.save();

    // Update user statistics
    await updateUserStats(req.user._id, 'image-prompt');

    res.json({
      success: true,
      project: project,
      imagePrompt: imagePrompt,
      trendingKeywords,
      baseContent
    });

  } catch (error) {
    console.error('Image prompt generation error:', error);
    
    if (project) {
      project.status = 'failed';
      await project.save();
    }
    
    res.status(500);
    throw new Error('Failed to generate image prompt');
  }
});

// Get user's content projects
export const getUserProjects = asyncHandler(async (req, res) => {
  const projects = await ContentProject.find({ user: req.user._id })
    .select('title projectType status location category createdAt updatedAt')
    .sort({ updatedAt: -1 });

  res.json(projects);
});

// Get specific project
export const getProject = asyncHandler(async (req, res) => {
  const project = await ContentProject.findById(req.params.id);

  if (!project || project.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Project not found');
  }

  res.json(project);
});

// Delete project
export const deleteProject = asyncHandler(async (req, res) => {
  const project = await ContentProject.findById(req.params.id);

  if (!project || project.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error('Project not found');
  }

  await ContentProject.deleteOne({ _id: project._id });
  res.json({ message: 'Project deleted successfully' });
});