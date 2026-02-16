import MainLayout from '@/components/layout/MainLayout';

export default function Layout({ children }) {
    return (
        <MainLayout>
            {children}
        </MainLayout>
    );
}
