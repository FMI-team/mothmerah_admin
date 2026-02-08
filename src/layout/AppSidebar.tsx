/* eslint-disable @next/next/no-img-element */

"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
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
import { getRole } from "@/utils/auth";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const adminNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "لوحة التحكم",
    path: "/",
  },
  {
    icon: <GroupIcon />,
    name: "ادارة المستخدمين",
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
    name: "التقارير المالية",
    path: "/reports",
  },
  {
    icon: <PlugInIcon />,
    name: "اعدادات المنصة",
    path: "/settings",
  },
  {
    icon: <ChatIcon />,
    name: "تذاكر الدعم",
    path: "/support",
  },
];

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
    name: "ادارة المخزون",
    path: "/wholesaler/inventory",
  },
  {
    icon: <DocsIcon />,
    name: "ادارة الفواتير",
    path: "/wholesaler/invoices",
  }
];

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
  }
];

const commercialBuyerNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "لوحة التحكم",
    path: "/commercial-buyer",
  },
  {
    icon: <BoxIcon />,
    name: "كتالوج المنتجات",
    path: "/commercial-buyer/products",
  },
  {
    icon: <BoltIcon />,
    name: "ادارة المزادات",
    path: "/commercial-buyer/auctions",
  },
  {
    icon: <DocsIcon />,
    name: "ادارة الفواتير",
    path: "/commercial-buyer/invoices",
  }
];

const baseUserNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "لوحة التحكم",
    path: "/base-user",
  },
  {
    icon: <BoltIcon />,
    name: "ادارة المزادات",
    path: "/base-user/auctions",
  },
  {
    icon: <DocsIcon />,
    name: "ادارة الفواتير",
    path: "/base-user/invoices",
  }
];

const othersItems: NavItem[] = [];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const [userType, setUserType] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loadUserType = async () => {
      setUserType(getRole());
    };
    loadUserType();
  }, []);

  const navItems = useMemo(() => {
    if (userType === "WHOLESALER" || userType === "wholesaler") {
      return wholesalerNavItems;
    } else if (userType === "FARMER" || userType === "farmer") {
      return farmerNavItems;
    } else if (userType === "COMMERCIAL_BUYER" || userType === "commercial_buyer" || userType === "COMMERCIALBUYER" || userType === "commercialBuyer") {
      return commercialBuyerNavItems;
    } else if (userType === "BASE_USER" || userType === "base_user" || userType === "BASEUSER" || userType === "baseUser") {
      return baseUserNavItems;
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

  const isActive = useCallback((path: string) => {
    if (path === pathname) {
      return true;
    }
    
    if (path === "/") {
      return pathname === "/";
    }
    
    if (path === "/wholesaler") {
      return pathname === "/wholesaler" || pathname === "/wholesaler/";
    }
    
    if (path === "/farmer") {
      return pathname === "/farmer" || pathname === "/farmer/";
    }
    
    if (path === "/commercial-buyer") {
      return pathname === "/commercial-buyer" || pathname === "/commercial-buyer/";
    }
    
    if (path === "/base-user") {
      return pathname === "/base-user" || pathname === "/base-user/";
    }
    
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
              <a
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
              </a>
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
                    <a
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
                    </a>
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

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive, navItems]);

  useEffect(() => {
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
        <a 
          href={
            userType === "WHOLESALER" || userType === "wholesaler"
              ? "/wholesaler"
              : userType === "FARMER" || userType === "farmer"
              ? "/farmer"
              : userType === "COMMERCIAL_BUYER" || userType === "commercial_buyer" || userType === "COMMERCIALBUYER" || userType === "commercialBuyer"
              ? "/commercial-buyer"
              : userType === "BASE_USER" || userType === "base_user" || userType === "BASEUSER" || userType === "baseUser"
              ? "/base-user"
              : "/"
          }
        >
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img src="/images/logo/logo.png" alt="Logo" className="dark:hidden" />
              <img src="/images/logo/logo.png" alt="Logo" className="hidden dark:block" />
            </>
          ) : (
            <img src="/images/logo/logo-icon.png" alt="Logo" className="w-4 h-4" />
          )}
        </a>
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
                        : userType === "COMMERCIAL_BUYER" || userType === "commercial_buyer" || userType === "COMMERCIALBUYER" || userType === "commercialBuyer"
                        ? "مشتري تجاري"
                        : userType === "BASE_USER" || userType === "base_user" || userType === "BASEUSER" || userType === "baseUser"
                        ? "مستخدم أساسي"
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