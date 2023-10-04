import pymysql
# 連線資料
def insert_data(userid, emailid, name):
    db1 = pymysql.connect(host = "your host",
                        user = "your user",
                        passwd = "your password",
                        database = "your shoes",
                        port = your port)
    try:
        with db1.cursor() as cursor:
            sql = "SELECT COUNT(*) FROM InputData_EMAIL_UserID WHERE UserID = %s AND EMAILID = %s"
            cursor.execute(sql, (userid, emailid))
            result = cursor.fetchone()
            if result[0] > 0:
                # print("資料已存在，不執行插入動作")
                return
            # 定義要插入的資料
            data = {
                'UserID': userid,
                'EMAILID': emailid,
                'name': name
            }

            # 執行 SQL INSERT 語句
            sql = "INSERT INTO InputData_EMAIL_UserID (Name, UserID, EMAILID) VALUES (%(name)s, %(UserID)s, %(EMAILID)s)"
            cursor.execute(sql, data)

        # 提交變更到資料庫
        db1.commit()
    finally:
        # 關閉資料庫連接
        db1.close()









