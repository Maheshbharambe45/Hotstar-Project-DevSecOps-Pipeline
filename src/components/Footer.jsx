import React from 'react'
import './Footer.css'

function Footer() {
  return (
    <div>
        <div className='footer'>
            <div>
                <h3>Company</h3>
                <a href="#"><h4>About us</h4></a>
                <a href="#"><h4>Careers</h4></a>
                <p style={{marginTop:"20px"}}>&copy;2023 STAR . All rights reserved</p>
                <a href="#"><p>Terms of Use &nbsp; Privacy  Policy &nbsp; FAQ </p></a>
            </div>

            <div>
                <h3>View website in</h3>
                <a href="#"><h4>English</h4></a>
                
            </div>

            <div>
                <h3>Need help ?</h3>
                <a href="#"><h4>Visit Help center</h4></a>
                <a href="#"><h4>Share feedback</h4></a>
               
            </div>

            <div>
                <h3 style={{textAlign:"center"}}>Connect with Us</h3>
                
                <div className='ic'>
                    <i className="fa-brands fa-facebook"></i>
                    <i className="fa-brands fa-twitter"></i>
                </div>
                <div className='emg'>
                    <img src="https://1000logos.net/wp-content/uploads/2021/07/Google-Play-Logo-768x432.png" alt="Get on Google Play" />

                </div>

               
            </div>

            

        </div>

    </div>
  )
}

export default Footer