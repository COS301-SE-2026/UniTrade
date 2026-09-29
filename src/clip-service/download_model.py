from transformers import CLIPModel, CLIPProcessor

MODEL_NAME = "openai/clip-vit-base-patch32"

# Download model + cache the model + processor into image's HF cache 
CLIPModel.from_pretrained(MODEL_NAME)
CLIPProcessor.from_pretrained(MODEL_NAME)
print(f"Baked {MODEL_NAME} into the image.")