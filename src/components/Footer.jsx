import React from 'react'
import './Footer.css'
function Footer() {
  return (
    <div>
      <div className='footer'>
        <div>
          <h3>Company</h3>
          <a href="/about-us"><h4>About us</h4></a>
          <a href="/careers"><h4>Careers</h4></a>
          <p style={{marginTop:"20px"}}>&copy;2023 STAR . All rights reserved</p>
          <a href="/terms-of-use"><p>Terms of Use &nbsp; Privacy Policy &nbsp; FAQ </p></a>
        </div>
        <div>
          <h3>View website in</h3>
          <a href="/english"><h4>English</h4></a>
        </div>
        <div>
          <h3>Need help ?</h3>
          <a href="/help-center"><h4>Visit Help center</h4></a>
          <a href="/share-feedback"><h4>Share feedback</h4></a>
        </div>
        <div>
          <h3 style={{textAlign:"center"}}>Connect with Us</h3>
          <div className='ic'>
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-facebook"></i>
            </a>
            <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer">
              <i className="fa-brands fa-twitter"></i>
            </a>
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