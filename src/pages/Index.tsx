import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import FeaturedTutors from "@/components/FeaturedTutors";
import SubjectCategories from "@/components/SubjectCategories";
import AIMatchingSection from "@/components/AIMatchingSection";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <FeaturedTutors />
      <SubjectCategories />
      <AIMatchingSection />
      <Testimonials />
      <CTASection />
      <Footer />
    </main>
  );
};

export default Index;
