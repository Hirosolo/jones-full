import { useEffect, useRef, useState } from "react";
import { Router } from "next/router";

import Link from "next/link";
import { FiSearch, FiMenu } from "react-icons/fi";
import { BiCaretDown } from "react-icons/bi";
import { IoIosArrowForward } from "react-icons/io";

import Logo from "@Components/common/Logo";
import ToolTip from "@Components/common/ToolTip";
import { getPathString } from "src/utils";
import { getCategories } from "@Lib/api/catalog";
import type { BackendCategory } from "src/types/backend";
import useBrandGroups from "@Hooks/useBrandGroups";

import useScrollTop from "@Hooks/useScrollTop";
import { DialogType, useCurrencyFormatter, useDialog } from "@Contexts/UIContext";
import { useAuthState } from "@Contexts/AuthContext";

type DropdownMode = "categories" | "brands" | null;

export default function HeaderSection() {
  const { setDialog } = useDialog();

  const [dropdownMode, setDropdownMode] = useState<DropdownMode>(null);
  const [expandedBrandsGroup, setExpandedBrandsGroup] = useState<string | null>(null);
  const [activeBrandsGroup, setActiveBrandsGroup] = useState<string | null>(null);
  const { brandGroups, loading: brandGroupsLoading, refreshBrandGroups } = useBrandGroups();
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [pinnedState, setPinnedState] = useState(false);
  const scrollTop = useScrollTop();
  const headerRef = useRef<HTMLElement>(null);
  const format = useCurrencyFormatter();
  const { user } = useAuthState();
  // cart removed from UI — keep user reference for other features
  const cartCount = 0;
  const cartTotal = 0;

  useEffect(() => {
    const mainBanner = document.getElementById("main-banner");
    if (mainBanner) {
      setPinnedState(scrollTop > mainBanner.offsetTop + mainBanner.clientHeight);
    }
  }, [scrollTop]);

  useEffect(() => {
    const hideDropdown = () => {
      setDropdownMode(null);
      setExpandedBrandsGroup(null);
    };
    Router.events.on("routeChangeStart", hideDropdown);
    return () => Router.events.off("routeChangeStart", hideDropdown);
  }, []);

  useEffect(() => {
    let active = true;
    getCategories()
      .then((items) => {
        if (!active) return;
        setCategories(items);
      })
      .catch(() => {
        if (!active) return;
        setCategories([{ name: "All", slug: "all", order: 0 }]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const groups = Object.keys(brandGroups);
    if (groups.length === 0) {
      setActiveBrandsGroup(null);
      return;
    }

    if (!activeBrandsGroup || !brandGroups[activeBrandsGroup]) {
      setActiveBrandsGroup(groups[0]);
    }
  }, [activeBrandsGroup, brandGroups]);

  const [hoveredElement, setHoveredElement] = useState<string>("");

  const toggleDropdown = (mode: DropdownMode) => {
    if (dropdownMode === mode) {
      setDropdownMode(null);
    } else {
      setDropdownMode(mode);
      if (mode === "brands") {
        void refreshBrandGroups();
        // Initialize with the first group if none active
        const groups = Object.keys(brandGroups);
        if (groups.length > 0 && !activeBrandsGroup) {
          setActiveBrandsGroup(groups[0]);
        }
      }
      setExpandedBrandsGroup(null);
    }
  };

  return (
    <>
      <header
        ref={headerRef}
        className={`header${pinnedState ? " header--pinned" : ""}`}
      >
        <div className="header__container">
          <div className="header__menu-button">
            <button
              aria-label="menu"
              className="header__menu-toggle"
              onClick={() => setDialog(DialogType.SIDEBAR_DIALOG)}
            >
              <FiMenu />
            </button>
          </div>

          <div className="header__logo">
            <Logo />
          </div>

          <div className="header__nav">
            <nav>
              <ul>
                <li className="header__nav-link">
                  <Link href="#">
                    <a
                      onClick={(e) => {
                        e.preventDefault();
                        toggleDropdown("categories");
                      }}
                    >
                      CATEGORIES <BiCaretDown className="header__nav-caret" />
                    </a>
                  </Link>
                </li>
                <li className="header__nav-link">
                  <Link href="#">
                    <a
                      onClick={(e) => {
                        e.preventDefault();
                        toggleDropdown("brands");
                      }}
                    >
                      BRANDS <BiCaretDown className="header__nav-caret" />
                    </a>
                  </Link>
                </li>
                <li className="header__nav-link">
                  <Link href="/about">
                    <a>ABOUT US</a>
                  </Link>
                </li>
                <li className="header__nav-link">
                  <Link href="/contact">
                    <a>CONTACT US</a>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="header__buttons">
            <ul>
              <li className="header__button header__button-search">
                <Link href="./#">
                  <a
                    className="header__button-link"
                    onClick={(e) => {
                      e.preventDefault();
                      setDialog(DialogType.SEARCH_BOX);
                    }}
                  >
                    <FiSearch />
                  </a>
                </Link>
              </li>
              {/* Cart removed from header */}
            </ul>
          </div>
        </div>
      </header>

      <div
        className={
          "header__dropdown" +
          (dropdownMode ? " header__dropdown--visible" : "") +
          (pinnedState ? " header__dropdown--pinned" : "")
        }
      >
        {/* ── CATEGORIES: Grid Layout ──────────────────────────────── */}
        {dropdownMode === "categories" && (
          <div className="header__brands-accordion header__categories-grid">
            {categories
              .filter((category) => getPathString(category.slug || category.name) !== "all")
              .sort((left, right) => {
                const leftOrder = left.order ?? 0;
                const rightOrder = right.order ?? 0;
                if (leftOrder !== rightOrder) return leftOrder - rightOrder;
                return (left.name || "").localeCompare(right.name || "");
              })
              .map((category) => (
              <div key={category.slug} className="header__brands-group">
                <Link href={"/category/" + getPathString(category.slug || category.name)}>
                  <a className="header__brands-group-btn header__brands-group-btn--link">
                    {category.name}
                  </a>
                </Link>
              </div>
            ))}
            <div className="header__brands-group">
              <Link href="/category/all">
                <a className="header__brands-group-btn header__brands-group-btn--link">
                  VIEW ALL
                </a>
              </Link>
            </div>
          </div>
        )}

        {/* ── BRANDS: Two-Pane Layout ───────────────────────────────── */}
        {dropdownMode === "brands" && (
          <div className="header__brands-two-pane">
            <div className="header__brands-sidebar">
              {brandGroupsLoading ? (
                <div className="header__brands-sidebar-item" style={{ opacity: 0.75, cursor: "default" }}>
                  Loading brands...
                </div>
              ) : Object.keys(brandGroups).map((group) => (
                <button
                  key={group}
                  className={`header__brands-sidebar-item${
                    activeBrandsGroup === group ? " active" : ""
                  }`}
                  onMouseEnter={() => setActiveBrandsGroup(group)}
                >
                  {group}
                  <IoIosArrowForward className="header__brands-sidebar-icon" />
                </button>
              ))}
            </div>
            <div className="header__brands-content">
              <div className="header__brands-content-grid">
                {brandGroupsLoading ? (
                  <div className="header__brands-content-item">Loading database brands...</div>
                ) : activeBrandsGroup && brandGroups[activeBrandsGroup]?.length ? (
                  brandGroups[activeBrandsGroup].map((brand) => (
                    <div key={brand} className="header__brands-content-item">
                      <Link href={`/brand/${getPathString(brand)}`}>
                        <a>{brand}</a>
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="header__brands-content-item">No brands available.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
