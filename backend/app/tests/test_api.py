# Tests for API endpoints

def society_payload(name="Test Society", uid="committee1", email="a@example.com"):
    return {"society": {
        "society_name": name, "address": "Some road, Mumbai", "locality": "Andheri",
        "pin_code": "400053", "total_buildings": 1, "total_flats": 10, "actual_residents": 40,
        "flat_categories": [{"flat_type": "2BHK", "flat_count": 10, "average_residents_per_flat": 4}]},
        "committee": {"full_name": "Test User", "email": email, "user_id": uid,
                      "password": "Passw0rdOK", "confirm_password": "Passw0rdOK", "accepted_terms": True}}


def report_payload(start="2025-01-01", end="2025-01-31"):
    return {"period_start": start, "period_end": end,
            "sources": [{"source": "municipal", "quantity": 200000, "unit": "L", "method": "measured"}],
            "household_quantity": 150000, "household_method": "estimated",
            "beginning_storage": 10000, "ending_storage": 10000}


def login(client, uid="committee1"):
    r = client.post("/api/auth/login", json={"user_id": uid, "password": "Passw0rdOK"})
    assert r.status_code == 200


def test_empty_leaderboard(client):
    r = client.get("/api/leaderboard")
    assert r.status_code == 200 and r.json()["items"] == []


def test_register_and_duplicate_user_id(client):
    assert client.post("/api/auth/register", json=society_payload()).status_code == 201
    dup = client.post("/api/auth/register", json=society_payload("Other", email="b@example.com"))
    assert dup.status_code == 409


def test_flat_sum_validation(client):
    p = society_payload()
    p["society"]["total_flats"] = 12
    assert client.post("/api/auth/register", json=p).status_code == 422


def test_unauthorized_dashboard(client):
    assert client.get("/api/water-reports").status_code == 401


def test_report_and_leaderboard(client):
    client.post("/api/auth/register", json=society_payload())
    login(client)
    r = client.post("/api/water-reports", json=report_payload())
    assert r.status_code == 201
    assert client.post("/api/water-reports", json=report_payload()).status_code == 409  # overlap
    lb = client.get("/api/leaderboard").json()
    assert lb["total"] == 1 and "password" not in str(lb)


def test_negative_quantity_rejected(client):
    client.post("/api/auth/register", json=society_payload())
    login(client)
    p = report_payload()
    p["household_quantity"] = -5
    assert client.post("/api/water-reports", json=p).status_code == 422


def test_cross_society_access_blocked(client):
    client.post("/api/auth/register", json=society_payload())
    login(client)
    rid = client.post("/api/water-reports", json=report_payload()).json()["report"]["id"]
    client.post("/api/auth/logout")
    client.post("/api/auth/register", json=society_payload("Society B", "committee2", "b@example.com"))
    login(client, "committee2")
    assert client.get(f"/api/water-reports/{rid}").status_code == 404