package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

type Provider string

const (
	OpenAI    Provider = "openai"
	Anthropic Provider = "anthropic"
	Groq      Provider = "groq"
	Google    Provider = "google"
)

type Client struct {
	Model    string
	provider Provider
	apiKey   string
	baseURL  string
}

func New(model string) (*Client, error) {
	provider, baseURL, envKey := detect(model)

	apiKey := os.Getenv(envKey)
	if apiKey == "" {
		return nil, fmt.Errorf("missing env var %s for model %s", envKey, model)
	}

	return &Client{
		Model:    model,
		provider: provider,
		apiKey:   apiKey,
		baseURL:  baseURL,
	}, nil
}

func detect(model string) (Provider, string, string) {
	m := strings.ToLower(model)

	switch {
	case strings.Contains(m, "gpt") ||
		strings.Contains(m, "o1") ||
		strings.Contains(m, "o3"):
		return OpenAI,
			"https://api.openai.com/v1/chat/completions",
			"OPENAI_API_KEY"

	case strings.Contains(m, "claude"):
		return Anthropic,
			"https://api.anthropic.com/v1/messages",
			"ANTHROPIC_API_KEY"

	case strings.Contains(m, "gemini"):
		return Google,
			"https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent",
			"GOOGLE_API_KEY"

	default: // llama, mixtral, etc → Groq
		return Groq,
			"https://api.groq.com/openai/v1/chat/completions",
			"GROQ_API_KEY"
	}
}

// Complete sends a prompt and returns the text response.
func (c *Client) Complete(ctx context.Context, system, user string) (string, error) {
	switch c.provider {
	case Anthropic:
		return c.anthropicComplete(ctx, system, user)
	default: // OpenAI-compatible (OpenAI, Groq, Google via compat layer)
		return c.openaiComplete(ctx, system, user)
	}
}

// --- OpenAI-compatible ---

type oaiRequest struct {
	Model     string       `json:"model"`
	Messages  []oaiMessage `json:"messages"`
	MaxTokens int          `json:"max_tokens"`
}

type oaiMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type oaiResponse struct {
	Choices []struct {
		Message oaiMessage `json:"message"`
	} `json:"choices"`

	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

func (c *Client) openaiComplete(
	ctx context.Context,
	system,
	user string,
) (string, error) {
	msgs := []oaiMessage{}

	if system != "" {
		msgs = append(msgs, oaiMessage{
			Role:    "system",
			Content: system,
		})
	}

	msgs = append(msgs, oaiMessage{
		Role:    "user",
		Content: user,
	})

	body, _ := json.Marshal(oaiRequest{
		Model:     c.Model,
		Messages:  msgs,
		MaxTokens: 50,
	})

	req, err := http.NewRequestWithContext(
		ctx,
		"POST",
		c.baseURL,
		bytes.NewReader(body),
	)
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)

	var out oaiResponse
	if err := json.Unmarshal(raw, &out); err != nil {
		return "", err
	}

	if out.Error != nil {
		return "", fmt.Errorf("openai error: %s", out.Error.Message)
	}

	if len(out.Choices) == 0 {
		return "", fmt.Errorf("no choices in response")
	}

	return strings.TrimSpace(out.Choices[0].Message.Content), nil
}

// --- Anthropic ---

type anthropicRequest struct {
	Model     string       `json:"model"`
	MaxTokens int          `json:"max_tokens"`
	System    string       `json:"system,omitempty"`
	Messages  []oaiMessage `json:"messages"`
}

type anthropicResponse struct {
	Content []struct {
		Text string `json:"text"`
	} `json:"content"`

	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

func (c *Client) anthropicComplete(
	ctx context.Context,
	system,
	user string,
) (string, error) {
	reqBody := anthropicRequest{
		Model:     c.Model,
		MaxTokens: 50,
		System:    system,
		Messages: []oaiMessage{
			{
				Role:    "user",
				Content: user,
			},
		},
	}

	body, _ := json.Marshal(reqBody)

	req, err := http.NewRequestWithContext(
		ctx,
		"POST",
		c.baseURL,
		bytes.NewReader(body),
	)
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", c.apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(resp.Body)

	var out anthropicResponse
	if err := json.Unmarshal(raw, &out); err != nil {
		return "", err
	}

	if out.Error != nil {
		return "", fmt.Errorf("anthropic error: %s", out.Error.Message)
	}

	if len(out.Content) == 0 {
		return "", fmt.Errorf("no content in response")
	}

	return strings.TrimSpace(out.Content[0].Text), nil
}
