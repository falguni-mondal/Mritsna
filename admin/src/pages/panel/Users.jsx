import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserStats, fetchUsersList } from "../../store/slices/userSlice";
import UserMetrics from "../../components/users/UserMetrics";
import UserTable from "../../components/users/UserTable";
import UserDrawer from "../../components/users/UserDrawer";

const Users = () => {
  const dispatch = useDispatch();
  const { stats, usersList, pagination, isLoading } = useSelector(
    (state) => state.adminUser
  );

  const [currentType, setCurrentType] = useState("all"); // 'all', 'user', 'visitor'
  const [currentActivity, setCurrentActivity] = useState("all");
  const [currentRegion, setCurrentRegion] = useState("global");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [drawerInitialTab, setDrawerInitialTab] = useState("cart");

  useEffect(() => {
    dispatch(fetchUserStats());
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(
        fetchUsersList({
          page: currentPage,
          limit: 15,
          type: currentType,
          activity: currentActivity,
          region: currentRegion,
          search: searchQuery,
        })
      );
    }, 250);

    return () => clearTimeout(timer);
  }, [dispatch, currentPage, currentType, currentActivity, currentRegion, searchQuery]);

  const handleTypeChange = (type) => {
    setCurrentType(type);
    setCurrentPage(1);
  };

  const handleActivityChange = (activity) => {
    setCurrentActivity(activity);
    setCurrentPage(1);
  };

  const handleRegionChange = (region) => {
    setCurrentRegion(region);
    setCurrentPage(1);
  };

  const handleSearchChange = (q) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };

  const handleInspectUser = (entityId, tab = "cart") => {
    setSelectedEntityId(entityId);
    setDrawerInitialTab(tab);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedEntityId(null), 300);
  };

  return (
    <div className="w-full min-h-screen bg-[#f8f8f8] p-6 lg:p-10 text-[#1a1a1a]">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-2xl lg:text-3xl font-light tracking-widest uppercase mb-2">
            Users & Visitors
          </h1>
          <p className="text-sm opacity-50">
            Track registered members and anonymous visitors—inspect live carts, wishlists, order history, and product ratings in one place.
          </p>
        </header>

        {/* Metrics Grid */}
        <UserMetrics stats={stats} isLoading={isLoading} />

        {/* Unified Directory Table */}
        <div className="mt-10 bg-white border border-black/5 p-6 shadow-sm">
          <UserTable
            users={usersList}
            pagination={pagination}
            isLoading={isLoading}
            currentType={currentType}
            currentActivity={currentActivity}
            currentRegion={currentRegion}
            searchQuery={searchQuery}
            onTypeChange={handleTypeChange}
            onActivityChange={handleActivityChange}
            onRegionChange={handleRegionChange}
            onSearchChange={handleSearchChange}
            onPageChange={setCurrentPage}
            onInspectUser={handleInspectUser}
          />
        </div>
      </div>

      {/* 360-Degree Customer & Visitor Drawer */}
      <UserDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        entityId={selectedEntityId}
        initialTab={drawerInitialTab}
      />
    </div>
  );
};

export default Users;
