import React, { useState } from "react";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const SignupContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f0f2f5;
`;

const SignupForm = styled.form`
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h2`
  margin-bottom: 20px;
  color: #333;
  text-align: center;
`;

const Input = styled.input`
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
`;

const Button = styled.button`
  padding: 12px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #218838;
  }
`;

const RoleSelect = styled.div`
  display: block;
  padding-top: 15px;
  margin-bottom: 20px;
  
  label {
      margin-bottom: 10px;
      color: #555;
      font-size: 14px;
  }

  div {
      display: flex;
      gap: 20px;
      justify-content: center;
  }

  input[type="radio"] {
      margin-right: 5px;
      accent-color: #28a745;
      cursor: pointer;
  }

  label[for="userRole"],
  label[for="adminRole"],
  label[for="superAdminRole"] {
      margin-left: 0;
      display: inline-flex;
      align-items: center;
      font-size: 15px;
      color: #333;
      cursor: pointer;
  }
`;

const ErrorMessage = styled.p`
  color: red;
  text-align: center;
`;

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("user"); // Added role state

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signup(email, password, role); // Pass selected role
      navigate("/wait"); // Redirect to a wait page or login page on successful signup
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <SignupContainer>
      <SignupForm onSubmit={handleSubmit}>
        <Title>Sign Up</Title>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <RoleSelect>
          <label>Register as:</label>
          <div>
            <input
              type="radio"
              id="userRole"
              name="role"
              value="user"
              checked={role === "user"}
              onChange={() => setRole("user")}
            />
            <label htmlFor="userRole">User</label>
            <input
              type="radio"
              id="adminRole"
              name="role"
              value="admin"
              checked={role === "admin"}
              onChange={() => setRole("admin")}
            />
            <label htmlFor="adminRole">Admin</label>
            <input
              type="radio"
              id="superAdminRole"
              name="role"
              value="superadmin"
              checked={role === "superadmin"}
              onChange={() => setRole("superadmin")}
            />
            <label htmlFor="superAdminRole">SuperAdmin</label>
          </div>
        </RoleSelect>
        <Button type="submit">Sign Up</Button>
      </SignupForm>
    </SignupContainer>
  );
};

export default Signup;