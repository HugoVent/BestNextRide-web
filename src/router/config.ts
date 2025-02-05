const routes = [
  {
    path: ["/", "/home"],
    exact: true,
    component: "Home",
  },
  {
    path: ["/contact"],
    exact: true,
    component: "Contact",
  },
  {path: ["/dashboard"],
    exact: true,
    component: "Dashboard",
  }
];

export default routes;
