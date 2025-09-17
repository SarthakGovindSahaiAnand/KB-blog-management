import React, { useState, useRef } from 'react';
import styled from 'styled-components' //installed via "npm install styled-components"
import { Link } from 'react-router-dom'; //installed via "npm install react-router-dom"
import { useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext'
import ErrorIcon from '@mui/icons-material/Error';
// import { storage } from '../contexts/InMemoryDB'
// import Header from './Header'


export default function EditUser() {

    
    const nameRef = useRef()
    const emailRef = useRef()
    const passwordRef = useRef()
    const confirmPasswordRef = useRef()
    const pictureRef = useRef()
    const { currentUser, updateName, updateEmail, updatePassword, updateProfilePicture } = useAuth()
    const[error, setError] = useState('')
    const[loading, setLoading] = useState(false)
    const navigate = useNavigate();

    const [file, setFile] = useState(null) // Initialize as null
    const [url, setURL] = useState("")

    
    // console.log(user)

    function handleFileChange(e) {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            setURL(URL.createObjectURL(e.target.files[0])); // Create a temporary URL for preview
        }
    }

    async function handleSubmit (e){
        e.preventDefault()
        if(passwordRef.current.value !== confirmPasswordRef.current.value){
            return  setError('The Passswords Do Not Match')
        }

        setLoading(true)
        setError('')

        let updatedUser = { ...currentUser }; // Create a mutable copy

        // Update name
        if (nameRef.current.value && nameRef.current.value !== currentUser.displayName) {
            updatedUser.displayName = nameRef.current.value;
            // database.saveUser(updatedUser.uid, { displayName: updatedUser.displayName }); 
        }

        // Update email
        if (emailRef.current.value && emailRef.current.value !== currentUser.email) {
            updatedUser.email = emailRef.current.value;
            // database.saveUser(updatedUser.uid, { email: updatedUser.email }); //
        }

        
        if (passwordRef.current.value) {
            updatedUser.password = passwordRef.current.value; // Assuming InMemoryDB stores password
            // database.saveUser(updatedUser.uid, { password: updatedUser.password }); 
        }

        // Update profile picture
        if (file) {
            // In a real local storage scenario, you might convert the image to base64 and store it.
            // For now, we'll just use the temporary URL or a placeholder.
            updatedUser.photoURL = url; // Use the temporary URL for display
            // database.saveUser(updatedUser.uid, { photoURL: updatedUser.photoURL }); 
            // Also update blogs by this user with the new profile picture
            // database.updateBlogsByUser(updatedUser.uid, {
            //     postedByProfilePic: updatedUser.photoURL,
            // });
        }

        try {
            // Use the update functions from AuthContext to handle the main logic
            if (nameRef.current.value && nameRef.current.value !== currentUser.displayName) {
                await updateName(nameRef.current.value);
            }
            if (emailRef.current.value && emailRef.current.value !== currentUser.email) {
                await updateEmail(emailRef.current.value);
            }
            if (passwordRef.current.value) {
                await updatePassword(passwordRef.current.value);
            }
            if (file) {
                await updateProfilePicture(url); // Update AuthContext with the new URL
            }
            // After all AuthContext updates, save the entire updatedUser object
            // AuthContext's update functions should internally call InMemoryDB.saveUser for basic fields
            // However, to ensureis fully consistent, a direct save might be considered if AuthContext isn't robust enough.
            // For now, rely on AuthContext propagating changes.

            alert("Profile Updated Successfully!");
            navigate('/');
        } catch (err) {
            setError('Failed to update account: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Container>
                {/* <Header urlvar={url}/> */}
                <RegisterContainer>
                    <h3>Update Profile</h3>
                    <hr/>

                     {/* // this code checks if theres error - it displays an error component */}
                    { 
                    error && 
                        <ErrorComponent>
                            <ErrorIcon className="error_icon"/>
                            {error}
                        </ErrorComponent>
                    }

                    <form onSubmit={handleSubmit} >
                        <Name>
                            <label htmlFor="name">Name</label>
                            <input id="name" type="text"  ref={nameRef} defaultValue={currentUser?.displayName || ''} /> 
                        </Name>
                        <Email>
                            <label htmlFor="email">Email Address</label>
                            {/* <p>{currentUser.email}</p> */}
                            <input id="email" type="email" ref={emailRef} defaultValue={currentUser?.email || ''} />
                        </Email>
                        <Password>
                            <label htmlFor="password">New Password</label>
                            <input id="password" type="password" ref={passwordRef} placeholder="Leave blank to keep the same" />
                        </Password>
                        <ConfirmPassword>
                            <label htmlFor="confirm-password">Confirm New Password</label>
                            <input id="confirm-password" type="password" ref={confirmPasswordRef} placeholder="Leave blank to keep the same" />
                        </ConfirmPassword>
                        <UploadImage>
                            <label htmlFor="picture">Profile Picture</label>
                            <input id="picture" type="file" accept="image/*" ref={pictureRef} onChange={handleFileChange} />
                            {url && <img src={url} alt="Profile Preview" style={{ width: '50px', height: '50px', borderRadius: '50%', marginLeft: '10px' }} />}
                        </UploadImage>
                       
                        <Submit>
                            <button disabled={loading} type="submit" >Update Profile</button>
                        </Submit>

                    </form>
                    <CancelText>
                        <h6> <Link to="/">Cancel</Link></h6>
                    </CancelText>
                </RegisterContainer>

                    
            </Container>
        
        
    )
}


const Container = styled.div`
    width: 100%;
    min-height: calc(100vh - 60px); /* Adjust for header height */
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f0f2f5; /* Match global background */
    padding: 20px 0;
`
const ErrorComponent = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c0392b; /* Muted red for error text */
    font-weight: 500; /* Slightly less bold */
    background-color: #fdecea; /* Very light red background */
    margin: 15px 11%; /* Adjusted margin */
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #e74c3c; /* Red border */

    .error_icon{
        transform: scale(0.9); /* Slightly larger icon */
        margin-right: 8px; /* Added spacing */
    }
`

const RegisterContainer = styled.div`
    width: 450px;
    /* margin: auto; */
    padding: 40px 0; /* Adjusted padding */
    border-radius: 10px;
    background-color: #ffffff; /* White background */
    box-shadow: rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px; /* Softer shadow */

    h3{
        text-align: center;
        margin-bottom: 20px; /* Increased margin */
        font-size: 28px; /* Larger heading */
        color: #333;
    }

    hr{
        margin: 0 11%;
        border: none;
        border-top: 1px solid #eee; /* Subtle separator */
    }
    
    form{
        margin:  20px 40px;

        input{
            width: 100%; /* Make input take full width */
            /* margin-right: 10px; */
            font-size: 16px; /* Slightly larger font */
            padding: 10px 0; /* Increased vertical padding */
            border: none;
            border-bottom: 1px solid #ccc; /* Lighter border */
            background-color: transparent;
            transition: border-bottom-color 0.3s ease; /* Smooth transition */
            
            :focus{
                outline: none;
                border-bottom-color: #0582c3; /* Blue on focus */
            }
        }
        label{
            display: block; /* Make label a block element */
            margin-left: 0;
            margin-bottom: 8px; /* Spacing below label */
            font-size: 14px;
            color: #555;
        }
    }
`
const Name = styled.div`
    display: block; /* Change to block for stacked labels/inputs */
    /* justify-content: space-between; */
    /* align-items: center; */
    padding-top: 15px; /* Adjusted padding */
    /* height: 30px; */
    margin-bottom: 20px; /* More spacing between fields */
`
const Email = styled.div`
    display: block; /* Change to block for stacked labels/inputs */
    /* justify-content: space-between; */
    /* align-items: center; */
    padding-top: 15px; /* Adjusted padding */
    /* height: 30px; */
    margin-bottom: 20px; /* More spacing between fields */
`
const Password = styled.div`
    display: block; /* Change to block for stacked labels/inputs */
    /* justify-content: space-between; */
    /* align-items: center; */
    padding-top: 15px; /* Adjusted padding */
    /* height: 30px; */
    margin-bottom: 20px; /* More spacing between fields */
`
const ConfirmPassword = styled.div`
    display: block; /* Change to block for stacked labels/inputs */
    /* justify-content: space-between; */
    /* align-items: center; */
    padding-top: 15px; /* Adjusted padding */
    /* height: 30px; */
    margin-bottom: 20px; /* More spacing between fields */
`
const Submit = styled.div`
    text-align: center;
    margin: 30px 0 10px 0; /* Adjusted margins */
    padding: 0;
    
    button{
        height: 45px; /* Slightly taller button */
        padding: 0 25px; /* Increased padding */
        margin-bottom: 10px; /* Increased margin */
        background: #0582c3; /* Primary blue color */
        color: white;
        border: none;
        border-radius: 5px; /* Slightly more rounded */
        width: 100%;
        cursor: pointer;
        font-size: 17px;
        font-weight: 600;
        letter-spacing: 0.5px;
        transition: background-color 0.3s ease, transform 0.2s ease;

        &:hover {
            background-color: #0468a3; /* Darker blue on hover */
            transform: translateY(-2px); /* Lift effect */
        }
        &:disabled {
            background-color: #cccccc;
            cursor: not-allowed;
            transform: translateY(0); /* No lift when disabled */
        }
    }
`
const CancelText = styled.div`
    text-align: center;
    font-size: 15px; /* Adjusted font size */
    margin-top: 20px; /* Increased margin */
    color: #666;
    h6{
        a{
            text-decoration: none; /* Remove underline by default */
            cursor: pointer;
            color: #0582c3; /* Primary blue for links */
            font-weight: 500;
            &:hover {
                color: #0468a3;
                text-decoration: underline; /* Underline on hover */
            }
        }
    }
`
const UploadImage = styled.div`
    display: block; /* Change to block for stacked labels/inputs */
    padding-top: 15px; /* Adjusted padding */
    margin-bottom: 20px; /* More spacing between fields */

    label{
        display: block;
        margin-left: 0;
        margin-bottom: 8px;
        font-size: 14px;
        color: #555;
    }
    
    input[type="file"]{
        width: 100%;
        border: 1px solid #ccc; /* Add border for file input */
        padding: 8px;
        border-radius: 5px;
        background-color: #f8f8f8;
        cursor: pointer;
    }
`