import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface SectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}

export const Section = ({ title, description, children, className, id }: SectionProps) => {
  return (
    <section id={id} className={cn('py-12 md:py-20', className)}>
      <div className="max-w-6xl mx-auto px-6">
        {title && (
          <div className="max-w-3xl mb-12 md:mb-16">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold mb-4"
            >
              {title}
            </motion.h2>
            {description && (
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-muted-foreground text-lg md:text-xl leading-relaxed"
              >
                {description}
              </motion.p>
            )}
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: '80px' }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="h-1 bg-gradient-brand mt-6 rounded-full"
            />
          </div>
        )}
        <div className="w-full">
          {children}
        </div>
      </div>
    </section>
  );
};
