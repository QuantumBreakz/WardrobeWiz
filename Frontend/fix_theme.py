import os

def replace_in_dir(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".tsx"):
                path = os.path.join(root, file)
                with open(path, "r") as f:
                    content = f.read()
                
                # We replace all hardcoded text-black with text-foreground
                new_content = content.replace("text-black", "text-foreground")
                new_content = new_content.replace("border-black", "border-foreground")
                new_content = new_content.replace("bg-black", "bg-foreground")
                new_content = new_content.replace("ring-black", "ring-foreground")
                
                if new_content != content:
                    with open(path, "w") as f:
                        f.write(new_content)

replace_in_dir("src/pages")
replace_in_dir("src/components")
