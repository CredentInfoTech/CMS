/* eslint-disable @typescript-eslint/explicit-function-return-type */

import * as React from "react";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect } from "react";
import TestimonialVideos from "./TestimonialVideos";
import {
  faList,
  faHouseUser,
  faPlus,
  faFileVideo,
} from "@fortawesome/free-solid-svg-icons";
import "./Sidebar.css";
import RequestForm from "./RequestForm";
import Home from "./Dashboard";
import { ICmsRebuildProps } from "../ICmsRebuildProps";
import MasterLists from "./MasterLists";

const Sidebar = (props: ICmsRebuildProps) => {
  const [selectedMenu, setSelectedMenu] = useState("Home");
  const [animationKey, setAnimationKey] = useState(0);

  const handleMenuClick = (menu: string) => {
    setSelectedMenu(menu);
    setAnimationKey((prevKey) => prevKey + 1);
  };

  // Home click handler that also refreshes CMS details
  const handleHomeClick = async () => {
    if (props.refreshCmsDetails) {
      await props.refreshCmsDetails();
    }
    setSelectedMenu("Home");
    setAnimationKey((prevKey) => prevKey + 1);
  };

  const handleRequestFormExit = () => {
    setSelectedMenu("Home");
    setAnimationKey((prevKey) => prevKey + 1);
  };

  useEffect(() => {
    if (props.selectedMenu) {
      setSelectedMenu(props.selectedMenu);
    }
  }, [props.selectedMenu]);

  return (
    <div
      className="topbar-layout d-flex flex-column"
      style={{
        width: "100%",
        boxShadow:
          "0 8px 32px 0 rgba(31, 38, 135, 0.18), 0 1.5px 8px 0 rgba(255, 96, 89, 0.18), 0 0 0 6px #fff3 inset",
        borderRadius: "28px",
        backdropFilter: "blur(2px)",
      }}
    >
      {/* Top Bar */}
      <nav
        className="topbar d-flex align-items-center"
        style={{
          width: "100%",
          background: "#035DA2",
          color: "#fff",
          borderTopLeftRadius: "5px",
          borderTopRightRadius: "5px",
          minHeight: "60px",
          padding: "0 2rem",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {/* Logo on the left */}
        <div
          className="logo-container"
          style={{
            display: "flex",
            alignItems: "center",
            height: "60px",
          }}
        >
          <img
            src={require("../../assets/mainLogo-removebg-preview.png")}
            alt="Logo"
            style={{
              height: "60px",
              width: "90px",
              objectFit: "contain",
            }}
          />
        </div>
        {/* Menus on the right */}
        <ul
          className="menu-list d-flex flex-row mb-0"
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "1.5rem",
          }}
        >
          <li
            className={selectedMenu === "Home" ? "active" : ""}
            onClick={handleHomeClick}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: "0.7rem 1.2rem",
              // borderRadius: "12px",
              // background:
              //   selectedMenu === "Home" ? "rgba(255,255,255,0.18)" : "none",
              color: "#fff",
              fontWeight: selectedMenu === "Home" ? "bold" : 400,
              // boxShadow:
              //   selectedMenu === "Home" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              transition: "background 0.2s, box-shadow 0.2s, padding 0.2s",
            }}
          >
            <span
              className="menu-icon"
              style={{
                marginRight: "12px",
                width: "28px",
                display: "inline-block",
                textAlign: "center",
                filter:
                  selectedMenu === "Home"
                    ? "drop-shadow(0 2px 6px #fff2)"
                    : "none",
                transition: "margin 0.2s, filter 0.2s",
              }}
            >
              <FontAwesomeIcon icon={faHouseUser} />
            </span>
            <span
              className="menu-label"
              style={{ letterSpacing: "0.5px" }}
            >
              Home
            </span>
          </li>
          {props.userGroups.includes("CMSTeamMember") && (
            <>
              <li
                className={selectedMenu === "Create" ? "active" : ""}
                onClick={() => handleMenuClick("Create")}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "0.7rem 1.2rem",
                  // borderRadius: "12px",
                  // background:
                  //   selectedMenu === "Create"
                      // ? "rgba(255,255,255,0.18)"
                      // : "none",
                  color: "#fff",
                  fontWeight: selectedMenu === "Create" ? "bold" : 400,
                  // boxShadow:
                  //   selectedMenu === "Create"
                  //     ? "0 2px 8px rgba(0,0,0,0.08)"
                  //     : "none",
                  transition: "background 0.2s, box-shadow 0.2s, padding 0.2s",
                }}
              >
                <span
                  className="menu-icon"
                  style={{
                    marginRight: "12px",
                    width: "28px",
                    display: "inline-block",
                    textAlign: "center",
                    // filter:
                    //   selectedMenu === "Create"
                    //     ? "drop-shadow(0 2px 6px #fff2)"
                    //     : "none",
                    transition: "margin 0.2s, filter 0.2s",
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </span>
                <span
                  className="menu-label"
                  style={{ letterSpacing: "0.5px" }}
                >
                  Create
                </span>
              </li>
              <li
                className={selectedMenu === "MasterLists" ? "active" : ""}
                onClick={() => handleMenuClick("MasterLists")}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "0.7rem 1.2rem",
                  // borderRadius: "12px",
                  // background:
                  //   selectedMenu === "MasterLists"
                  //     ? "rgba(255,255,255,0.18)"
                  //     : "none",
                  color: "#fff",
                  fontWeight: selectedMenu === "MasterLists" ? "bold" : 400,
                  // boxShadow:
                  //   selectedMenu === "MasterLists"
                  //     ? "0 2px 8px rgba(0,0,0,0.08)"
                  //     : "none",
                  transition: "background 0.2s, box-shadow 0.2s, padding 0.2s",
                }}
              >
                <span
                  className="menu-icon"
                  style={{
                    marginRight: "12px",
                    width: "28px",
                    display: "inline-block",
                    textAlign: "center",
                    // filter:
                    //   selectedMenu === "MasterLists"
                    //     ? "drop-shadow(0 2px 6px #fff2)"
                    //     : "none",
                    transition: "margin 0.2s, filter 0.2s",
                  }}
                >
                  <FontAwesomeIcon icon={faList} className="menu-icon" />
                </span>
                <span
                  className="menu-label"
                  style={{ letterSpacing: "0.5px" }}
                >
                  Master Lists
                </span>
              </li>
            </>
          )}
          <li
            className={selectedMenu === "TestimonialVideos" ? "active" : ""}
            onClick={() => handleMenuClick("TestimonialVideos")}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: "0.7rem 1.2rem",
              // borderRadius: "12px",
              // background:
              //   selectedMenu === "TestimonialVideos"
              //     ? "rgba(255,255,255,0.18)"
              //     : "none",
              color: "#fff",
              fontWeight: selectedMenu === "TestimonialVideos" ? "bold" : 400,
              // boxShadow:
              //   selectedMenu === "TestimonialVideos"
              //     ? "0 2px 8px rgba(0,0,0,0.08)"
              //     : "none",
              transition: "background 0.2s, box-shadow 0.2s, padding 0.2s",
            }}
          >
            <span
              className="menu-icon"
              style={{
                marginRight: "12px",
                width: "28px",
                display: "inline-block",
                textAlign: "center",
                transition: "margin 0.2s, filter 0.2s",
              }}
            >
              <FontAwesomeIcon icon={faFileVideo} className="menu-icon" />
            </span>
            <span
              className="menu-label"
              style={{ letterSpacing: "0.5px" }}
            >
              Testimonial Videos
            </span>
          </li>
        </ul>
      </nav>
      {/* Main Content */}
      <div
        className="content"
        key={animationKey}
        style={{
          width: "100%",
          minHeight: "80vh",
          background: "#fafbfc",
          transition: "margin 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {selectedMenu === "Create" && (
          <RequestForm
            description={props.description}
            context={props.context}
            siteUrl={props.siteUrl}
            userGroups={props.userGroups}
            refreshCmsDetails={props.refreshCmsDetails}
            cmsDetails={props.cmsDetails}
            onExit={handleRequestFormExit}
          />
        )}
        {selectedMenu === "Home" && (
          <Home
            description={props.description}
            context={props.context}
            siteUrl={props.siteUrl}
            userGroups={props.userGroups}
            refreshCmsDetails={props.refreshCmsDetails}
            cmsDetails={props.cmsDetails}
            selectedMenu="Home"
          />
        )}
        {selectedMenu === "MasterLists" && (
          <MasterLists
            description={props.description}
            context={props.context}
            siteUrl={props.siteUrl}
            userGroups={props.userGroups}
            refreshCmsDetails={props.refreshCmsDetails}
            cmsDetails={props.cmsDetails}
          />
        )}
        {selectedMenu === "TestimonialVideos" && (
          <TestimonialVideos
            description={props.description}
            context={props.context}
            siteUrl={props.siteUrl}
            userGroups={props.userGroups}
            refreshCmsDetails={props.refreshCmsDetails}
            cmsDetails={props.cmsDetails}
          />
        )}
      </div>
    </div>
  );
};

export default Sidebar;
