/*eslint-disable @typescript-eslint/explicit-function-return-type*/

import * as React from "react";
import "./Loader.scss"; // Ensure you create and import this CSS file

const CISLoader = () => {
  return (
    <div className="loader-container">
      <img src={require("../../assets/loader.gif")} alt="Loading..." className="loader-gif" />
      {/* <div className="loader-text">CIS</div> */}
    </div>
  );
};

export default CISLoader;