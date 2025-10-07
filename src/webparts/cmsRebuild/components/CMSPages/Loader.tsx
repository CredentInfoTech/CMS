/*eslint-disable @typescript-eslint/explicit-function-return-type*/

import * as React from "react";
import "./Loader.css"; // Ensure you create and import this CSS file

const CISLoader = () => {
  return (
    <div className="loader-container">
      {/* <img src={require("../../assets/loader.gif")} alt="Loading..." className="loader-gif" /> */}
      {/* <img src={require("../../assets/loader.gif")} alt="Loading..." className="loader-gif" /> */}
      <img src="https://assets-v2.lottiefiles.com/a/d5392796-1169-11ee-908e-b33ed8d96ca4/kW0SJwvz27.gif" alt="Loading..." className="loader-gif" />
      {/* <div className="loader-text">CIS</div> */}
    </div>
  );
};

export default CISLoader;