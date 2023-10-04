import requests
import json
import putDataInDatabase_v2
import sys
from urllib.parse import unquote

# 輸入linebot端資料
client_id = "your client id"
client_secret = "your client secret"
redirect_uri = "redirect uri"
user_id = ""
user_email = ""
user_name = ""
authorization_code = ""

# 獲取授權碼從 Node.js 傳遞的參數
authorization_code = sys.argv[1]


# Step 2: 訪問access token
def get_id_token(code):
    token_url = "https://api.line.me/oauth2/v2.1/token"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": client_id,
        "client_secret": client_secret
    }

    # 發送post已獲得id token
    response = requests.post(token_url, headers=headers, data=data)
    response_data = json.loads(response.text)
    # print(response_data)
    id_token = response_data["id_token"]
    # print(id_token)
    if "id_token" in response_data:
        id_token = response_data["id_token"]
        return id_token
    else:
        print("無法獲得id token，請重新連結一次。")
        return None
    
def get_data(id_token):
    token_url = "https://api.line.me/oauth2/v2.1/verify"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {
        "id_token": id_token,
        "client_id": client_id
    }

     # 發送post已獲得id token
    response = requests.post(token_url, headers=headers, data=data)
    response_data = json.loads(response.text)
    personal_name = response_data["name"]
    personal_id = response_data["sub"]
    personal_email = response_data["email"]
    # personal_gender = response_data["gender"]
    # personal_birthday = response_data["birthday"]
    response_personalData = personal_id, personal_email, personal_name
    return response_personalData

"""
    if "email" in response_data:
        email = response_data["email"]
        print(email)
        return email
    else:
        print("無法獲得email，請重新連結一次。")
        return None
"""


# Step 3: 獲得id token已進行json解析
"""
def get_id_token(access_token):
    user_profile_url = "https://api.line.me/v2/profile"
    user_data_url = "https://api.line.me/oauth2/v2.1/verify"
    # email_url = "https://api.line.me/oauth2/v2.1/verify"

    # 發送get請求獲取用戶資料
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    response = requests.get(user_profile_url, headers=headers)
    user_data = json.loads(response.text)
    print(user_data)
    # 获取电子邮件地址
    # email_response = requests.get(email_url, headers=headers)
    # email_data = json.loads(email_response.text)
    # email = email_data.get("email")

    # 将电子邮件地址添加到用户数据中
    # if email:
    #     user_data["email"] = email

    return user_data
"""
# 執行流程
if __name__ == "__main__":
    count = 0
    id_token = get_id_token(authorization_code)

    if id_token:
        user_data = get_data(id_token)

        # print("用戶資料：\n name: "+user_data[2]+"\n email: "+user_data[1]+"\n user_id: "+user_data[0])
        # print(user_data)

        user_id = user_data[0]
        user_email = user_data[1]
        user_name = user_data[2]

        print(user_id + ',' + user_email + ',' + user_name)
        

    
    # print(user_id, user_email)
    putDataInDatabase_v2.insert_data(user_id, user_email, user_name)
