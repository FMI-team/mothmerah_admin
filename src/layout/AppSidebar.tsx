"use client";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { getUserType, fetchAndStoreUserInfo } from "@/lib/auth";
import {
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  PieChartIcon,
  PlugInIcon,
  UserCircleIcon,
  GroupIcon,
  BoxIcon,
  DocsIcon,
  TaskIcon,
  ChatIcon,
  BoltIcon,
  BoxCubeIcon,
} from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

// Admin navigation items (full access)
const adminNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "لوحة التحكم",
    path: "/",
  },
  {
    icon: <GroupIcon />,
    name: "ادارة المستخدمين", // Admin only
    path: "/users",
  },
  {
    icon: <BoxIcon />,
    name: "كتالوج المنتجات",
    path: "/products",
  },
  {
    icon: <BoltIcon />,
    name: "ادارة المزادات",
    path: "/auctions",
  },
  {
    icon: <BoxCubeIcon />,
    name: "ادارة المخازن",
    path: "/warehouses",
  },
  {
    icon: <DocsIcon />,
    name: "ادارة الفواتير",
    path: "/invoices",
  },
  {
    icon: <TaskIcon />,
    name: "ادارة المطالبات",
    path: "/claims",
  },
  {
    icon: <PieChartIcon />,
    name: "التقارير المالية", // Admin only
    path: "/reports",
  },
  {
    icon: <PlugInIcon />,
    name: "اعدادات المنصة", // Admin only
    path: "/settings",
  },
  {
    icon: <ChatIcon />,
    name: "تذاكر الدعم", // Admin only
    path: "/support",
  },
];

// Wholesaler navigation items (no user management, reports, settings, support)
const wholesalerNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "لوحة التحكم",
    path: "/wholesaler",
  },
  {
    icon: <BoxIcon />,
    name: "كتالوج المنتجات",
    path: "/wholesaler/products",
  },
  {
    icon: <BoltIcon />,
    name: "ادارة المزادات",
    path: "/wholesaler/auctions",
  },
  {
    icon: <BoxCubeIcon />,
    name: "ادارة المخازن",
    path: "/wholesaler/warehouses",
  },
  {
    icon: <DocsIcon />,
    name: "ادارة الفواتير",
    path: "/wholesaler/invoices",
  }
];

// Farmer navigation items (limited access - products, auctions, warehouses, invoices, claims)
const farmerNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "لوحة التحكم",
    path: "/farmer",
  },
  {
    icon: <BoxIcon />,
    name: "كتالوج المنتجات",
    path: "/farmer/products",
  },
  {
    icon: <BoltIcon />,
    name: "ادارة المزادات",
    path: "/farmer/auctions",
  },
  {
    icon: <BoxCubeIcon />,
    name: "ادارة المخزون",
    path: "/farmer/warehouses",
  },
  {
    icon: <DocsIcon />,
    name: "ادارة الفواتير",
    path: "/farmer/invoices",
  },
  {
    icon: <TaskIcon />,
    name: "ادارة المطالبات",
    path: "/farmer/claims",
  },
];

const othersItems: NavItem[] = [];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const [userType, setUserType] = useState<string | null>(null);

  // Get user type on mount - fetch from API if not already stored
  useEffect(() => {
    const loadUserType = async () => {
      let type = getUserType();
      // If user type is not in localStorage, fetch from API
      if (!type) {
        type = await fetchAndStoreUserInfo();
      }
      setUserType(type);
    };
    loadUserType();
  }, []);

  // Determine which nav items to use based on user type
  const navItems = useMemo(() => {
    if (userType === "WHOLESALER" || userType === "wholesaler") {
      return wholesalerNavItems;
    } else if (userType === "FARMER" || userType === "farmer") {
      return farmerNavItems;
    } else {
      return adminNavItems;
    }
  }, [userType]);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Check if a path is active - since navItems are already filtered by user type,
  // we just need to check if the current pathname matches the path
  const isActive = useCallback((path: string) => {
    // Exact match
    if (path === pathname) {
      return true;
    }
    
    // Handle root paths
    // For admin "/" - only match if pathname is exactly "/"
    if (path === "/") {
      return pathname === "/";
    }
    
    // For wholesaler "/wholesaler" - match if pathname is exactly "/wholesaler" or starts with "/wholesaler/" but has no additional path segments
    if (path === "/wholesaler") {
      return pathname === "/wholesaler" || pathname === "/wholesaler/";
    }
    
    // For farmer "/farmer" - match if pathname is exactly "/farmer" or starts with "/farmer/" but has no additional path segments
    if (path === "/farmer") {
      return pathname === "/farmer" || pathname === "/farmer/";
    }
    
    // For other paths, check if pathname starts with the path followed by "/" or is exactly the path
    // This ensures /products matches /products but not /products-something
    return pathname === path || pathname.startsWith(path + "/");
  }, [pathname]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={` ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav: NavItem, index: number) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive, navItems]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 right-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-l border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link 
          href={
            userType === "WHOLESALER" || userType === "wholesaler"
              ? "/wholesaler"
              : userType === "FARMER" || userType === "farmer"
              ? "/farmer"
              : "/"
          }
        >
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/logo.png"
                alt="Logo"
                width={150}
                height={40}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo.png"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <Image
              src="/images/logo/logo-icon.png"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <div
                className={`mb-4 flex items-center gap-2 leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  <>
                    <UserCircleIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {userType === "WHOLESALER" || userType === "wholesaler"
                        ? "تاجر الجملة"
                        : userType === "FARMER" || userType === "farmer"
                        ? "مزارع"
                        : "مسؤول النظام"}
                    </span>
                  </>
                ) : (
                  <UserCircleIcon className="w-4 h-4 mx-auto" />
                )}
              </div>
              {renderMenuItems(navItems, "main")}
            </div>

            {othersItems.length > 0 && (
              <div className="">
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Others"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(othersItems, "others")}
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
