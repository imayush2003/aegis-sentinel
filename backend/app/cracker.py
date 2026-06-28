import hashlib
import time
import math
from typing import Dict, List, Optional
from pydantic import BaseModel

class PasswordCheckRequest(BaseModel):
    password: str

class HashCrackRequest(BaseModel):
    hash_value: str
    hash_type: str  # md5, sha1, sha256
    wordlist_depth: int  # 100, 1000, 5000

# Pre-defined list of common passwords (dictionary)
COMMON_PASSWORDS = [
    "123456", "password", "123456789", "12345678", "12345", "qwerty", "1234567", 
    "google", "dlink", "admin", "password123", "iloveyou", "111111", "123123", 
    "charlie", "letmein", "1234567890", "monkey", "shadow", "superman", "trustno1",
    "mustang", "football", "baseball", "soccer", "admin123", "guest", "root", "oracle",
    "welcome", "login", "secret", "security", "hunter2", "princess", "jessica", "daniel",
    "michael", "ashley", "matthew", "andrew", "nicholas", "christopher", "joseph", 
    "alexander", "ryan", "brandon", "joshua", "justin", "zachary", "robert", "david", 
    "william", "james", "john", "computer", "keyboard", "system", "network", "cybersecurity",
    "ethicalhacking", "sentinel", "aegis", "godpass", "rootadmin", "123456a", "qwertyuiop",
    "hello", "hello123", "love", "family", "pretty", "beautiful", "freedom", "matrix"
]

# Expand list programmatically to reach ~1000 to demonstrate scanning speeds
EXTENDED_COMMON_PASSWORDS = []
for p in COMMON_PASSWORDS:
    EXTENDED_COMMON_PASSWORDS.append(p)
    # Add variations
    EXTENDED_COMMON_PASSWORDS.append(p.capitalize())
    EXTENDED_COMMON_PASSWORDS.append(p + "1")
    EXTENDED_COMMON_PASSWORDS.append(p + "123")
    EXTENDED_COMMON_PASSWORDS.append(p + "!")
    EXTENDED_COMMON_PASSWORDS.append(p + "2026")
    EXTENDED_COMMON_PASSWORDS.append(p.upper())

# Ensure uniqueness
EXTENDED_COMMON_PASSWORDS = list(dict.fromkeys(EXTENDED_COMMON_PASSWORDS))

def calculate_entropy(password: str) -> float:
    if not password:
        return 0.0
    
    has_lower = any(c.islower() for c in password)
    has_upper = any(c.isupper() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(not c.isalnum() for c in password)
    
    pool_size = 0
    if has_lower:
        pool_size += 26
    if has_upper:
        pool_size += 26
    if has_digit:
        pool_size += 10
    if has_special:
        pool_size += 32
        
    if pool_size == 0:
        return 0.0
        
    entropy = len(password) * math.log2(pool_size)
    return round(entropy, 2)

def analyze_password(password: str) -> Dict:
    entropy = calculate_entropy(password)
    length = len(password)
    
    # Check if in common passwords list
    is_common = password.lower() in [p.lower() for p in COMMON_PASSWORDS]
    
    # Classify strength
    if length < 8 or is_common or entropy < 30:
        strength = "Very Weak"
        color = "#ff3860" # Red
    elif entropy < 50:
        strength = "Weak"
        color = "#ffdd57" # Yellow
    elif entropy < 75:
        strength = "Medium"
        color = "#209cee" # Blue
    else:
        strength = "Strong"
        color = "#00ff66" # Green
        
    # Security advice
    suggestions = []
    if length < 12:
        suggestions.append("Make it longer (at least 12-16 characters).")
    if not any(c.isupper() for c in password):
        suggestions.append("Add uppercase letters.")
    if not any(c.islower() for c in password):
        suggestions.append("Add lowercase letters.")
    if not any(c.isdigit() for c in password):
        suggestions.append("Add numeric characters.")
    if not any(not c.isalnum() for c in password):
        suggestions.append("Add special symbols (e.g., !, @, #, $, %).")
    if is_common:
        suggestions.append("This is a highly common dictionary password. Choose a unique phrase.")
        
    time_to_crack = "Instant"
    if strength == "Weak":
        time_to_crack = "A few minutes"
    elif strength == "Medium":
        time_to_crack = "Days to Months"
    elif strength == "Strong":
        time_to_crack = "Centuries"
        
    return {
        "password": password,
        "length": length,
        "entropy": entropy,
        "strength": strength,
        "color": color,
        "is_common": is_common,
        "suggestions": suggestions,
        "time_to_crack": time_to_crack
    }

def crack_hash(hash_value: str, hash_type: str, wordlist_depth: int) -> Dict:
    hash_value = hash_value.strip().lower()
    hash_type = hash_type.strip().lower()
    
    # Limit depth based on configuration
    wordlist = EXTENDED_COMMON_PASSWORDS[:wordlist_depth]
    
    start_time = time.time()
    attempts = 0
    cracked_password = None
    success = False
    
    for candidate in wordlist:
        attempts += 1
        
        # Calculate hash of candidate
        cand_bytes = candidate.encode('utf-8')
        if hash_type == 'md5':
            candidate_hash = hashlib.md5(cand_bytes).hexdigest()
        elif hash_type == 'sha1':
            candidate_hash = hashlib.sha1(cand_bytes).hexdigest()
        elif hash_type == 'sha256':
            candidate_hash = hashlib.sha256(cand_bytes).hexdigest()
        else:
            return {
                "success": False,
                "error": f"Unsupported hash type: {hash_type}",
                "elapsed_time": 0.0,
                "attempts": attempts
            }
            
        if candidate_hash == hash_value:
            cracked_password = candidate
            success = True
            break
            
    elapsed_time = time.time() - start_time
    
    # Simulate a tiny delay if crack was too fast, to make visual experience realistic
    if elapsed_time < 0.1:
        time.sleep(0.15 - elapsed_time)
        elapsed_time = 0.15
        
    return {
        "success": success,
        "hash_value": hash_value,
        "hash_type": hash_type,
        "cracked_password": cracked_password,
        "elapsed_time": round(elapsed_time, 4),
        "attempts": attempts,
        "wordlist_size": len(wordlist)
    }
