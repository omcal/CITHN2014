import { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Badge, Spinner } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Meta from '../components/Meta';
import Message from '../components/Message';

const ContentModifyScreen = () => {
  const [formData, setFormData] = useState({
    title: '',
    location: 'Germany',
    language: 'English',
    tone: 'professional',
    category: 'Technology',
    originalContent: '',
    modificationType: 'rephrase'
  });
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  if (!userInfo) {
    navigate('/login');
    return null;
  }

  const locations = [
    'Germany', 'United States', 'United Kingdom', 'France', 'Italy', 
    'Spain', 'Japan', 'Canada', 'Australia', 'Brazil', 'India', 'China'
  ];

  const languages = [
    'English', 'German', 'French', 'Spanish', 'Italian', 'Portuguese', 
    'Japanese', 'Chinese', 'Hindi', 'Arabic'
  ];

  const tones = [
    'persuasive', 'professional', 'friendly', 'casual', 'formal', 
    'enthusiastic', 'informative'
  ];

  const categories = [
    'luxury', 'apparel', 'Technology', 'fashion', 'toys', 
    'home-garden', 'sports', 'beauty', 'automotive', 'books'
  ];

  const modificationTypes = [
    { value: 'elaborate', label: 'Elaborate', description: 'Expand with richer details and examples' },
    { value: 'summarize', label: 'Summarize', description: 'Compress into a concise summary' },
    { value: 'rephrase', label: 'Rephrase', description: 'Reword to improve tone and clarity' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.originalContent) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/content/modify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to modify content');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleContent = () => {
    setFormData(prev => ({
      ...prev,
      originalContent: "Our new tablet has a good battery life and a decent screen resolution. It's perfect for everyday use."
    }));
  };

  return (
    <>
      <Meta title="Content Modification - AI Content Creator" />
      <Container>
        <Row>
          <Col md={8} className="mx-auto">
            <Card>
              <Card.Header>
                <h2 className="mb-0">🔄 Content Modification</h2>
                <small className="text-muted">
                  Transform your existing content - elaborate, summarize, or rephrase
                </small>
              </Card.Header>
              <Card.Body>
                {error && <Message variant="danger">{error}</Message>}
                
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Project Title *</Form.Label>
                        <Form.Control
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="e.g., Product Description Revision"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Target Location *</Form.Label>
                        <Form.Select
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          required
                        >
                          {locations.map(location => (
                            <option key={location} value={location}>{location}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Language *</Form.Label>
                        <Form.Select
                          name="language"
                          value={formData.language}
                          onChange={handleInputChange}
                          required
                        >
                          {languages.map(language => (
                            <option key={language} value={language}>{language}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Desired Tone *</Form.Label>
                        <Form.Select
                          name="tone"
                          value={formData.tone}
                          onChange={handleInputChange}
                          required
                        >
                          {tones.map(tone => (
                            <option key={tone} value={tone}>
                              {tone.charAt(0).toUpperCase() + tone.slice(1)}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Category *</Form.Label>
                        <Form.Select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          required
                        >
                          {categories.map(category => (
                            <option key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Modification Type *</Form.Label>
                        <Form.Select
                          name="modificationType"
                          value={formData.modificationType}
                          onChange={handleInputChange}
                          required
                        >
                          {modificationTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text className="text-muted">
                          {modificationTypes.find(t => t.value === formData.modificationType)?.description}
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <Form.Label>Original Content *</Form.Label>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={handleSampleContent}
                      >
                        Use Sample
                      </Button>
                    </div>
                    <Form.Control
                      as="textarea"
                      rows={6}
                      name="originalContent"
                      value={formData.originalContent}
                      onChange={handleInputChange}
                      placeholder="Paste your existing content here that you want to modify..."
                      required
                    />
                    <Form.Text className="text-muted">
                      {formData.originalContent.length} characters
                    </Form.Text>
                  </Form.Group>

                  <div className="text-center">
                    <Button 
                      type="submit" 
                      variant="success" 
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Modifying Content...
                        </>
                      ) : (
                        `${modificationTypes.find(t => t.value === formData.modificationType)?.label} Content`
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            {result && (
              <Card className="mt-4">
                <Card.Header>
                  <h4 className="mb-0">Modified Content</h4>
                  <small className="text-muted">
                    Project: {result.project.title} | Action: {formData.modificationType}
                  </small>
                </Card.Header>
                <Card.Body>
                  {result.trendingKeywords && result.trendingKeywords.length > 0 && (
                    <div className="mb-3">
                      <h6>Trending Keywords Applied:</h6>
                      {result.trendingKeywords.map((keyword, index) => (
                        <Badge key={index} bg="info" className="me-2">
                          {keyword.keyword} ({keyword.interest}%)
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <Row>
                    <Col md={6}>
                      <h6>Original Content:</h6>
                      <div 
                        className="p-3 bg-light border rounded mb-3"
                        style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}
                      >
                        {result.originalContent}
                      </div>
                    </Col>
                    <Col md={6}>
                      <h6>Modified Content:</h6>
                      <div 
                        className="p-3 bg-success bg-opacity-10 border border-success rounded mb-3"
                        style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}
                      >
                        {result.modifiedContent}
                      </div>
                    </Col>
                  </Row>

                  <div className="mt-3 text-center">
                    <Button 
                      variant="success" 
                      onClick={() => navigate('/projects')}
                      className="me-2"
                    >
                      View All Projects
                    </Button>
                    <Button 
                      variant="outline-primary" 
                      onClick={() => setResult(null)}
                    >
                      Modify Another
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default ContentModifyScreen;