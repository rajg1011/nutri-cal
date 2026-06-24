import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Drumstick,
  Dumbbell,
  Egg,
  Flame,
  Leaf,
  Mars,
  Ruler,
  Scale,
  Sprout,
  Target,
  Transgender,
  User,
  Venus,
  VenusAndMars,
  X,
  Zap,
} from 'lucide-react';
import axios from 'axios';
import supabase from '../core/supabaseClient';
import useScrollLock from './hooks/useScrollLock';
import './css/ProfileOnboarding.css';

const GENDERS = [
  { value: 'Male', label: 'Male', Icon: Mars },
  { value: 'Female', label: 'Female', Icon: Venus },
  { value: 'Other', label: 'Other', Icon: Transgender },
];

const DIET_TYPES = [
  { value: 'Vegetarian', label: 'Vegetarian', Icon: Leaf },
  { value: 'Vegan', label: 'Vegan', Icon: Sprout },
  { value: 'Eggetarian', label: 'Eggetarian', Icon: Egg },
  { value: 'Non-Vegetarian', label: 'Non-Vegetarian', Icon: Drumstick },
];

const GOALS = [
  { value: 'Fat Loss', label: 'Fat Loss', description: 'Lose body fat', Icon: Flame },
  { value: 'Maintenance', label: 'Maintenance', description: 'Stay at current weight', Icon: Scale },
  { value: 'Muscle Gain', label: 'Muscle Gain', description: 'Build muscle mass', Icon: Dumbbell },
  { value: 'Lean Bulk', label: 'Lean Bulk', description: 'Gain muscle, minimal fat', Icon: Dumbbell },
];

const ACTIVITY_LEVELS = [
  { value: 'Sedentary', label: 'Sedentary', description: 'Little or no exercise', dots: 1 },
  { value: 'Light', label: 'Light', description: '1-3 days/week', dots: 2 },
  { value: 'Moderate', label: 'Moderate', description: '3-5 days/week', dots: 3 },
  { value: 'Active', label: 'Active', description: '6-7 days/week', dots: 4 },
  { value: 'Very Active', label: 'Very Active', description: 'Hard exercise daily', dots: 5 },
];

const INITIAL_PROFILE = {
  name: '',
  gender: 'Male',
  age: '',
  height: '',
  weight: '',
  dietType: 'Vegetarian',
  goal: ['Fat Loss'],
  activityLevel: 'Moderate',
};

const validateNumber = (value, min, max, label, unit = '') => {
  const numericValue = Number(value);
  if (!Number.isInteger(numericValue)) return `Enter a valid ${label.toLowerCase()}${unit ? ` (${min}-${max})` : ''}`;
  if (numericValue < min || numericValue > max) {
    return `Enter ${label.toLowerCase()} between ${min}-${max}${unit ? ` ${unit}` : ''}`;
  }
  return '';
};

const getUserDisplayName = (user) => (
  user?.user_metadata?.full_name ||
  user?.user_metadata?.name ||
  ''
).trim();

const formatGoalsForDb = (goals) => {
  if (goals.length <= 2) return goals.join(' and ');
  return `${goals.slice(0, -1).join(', ')} and ${goals.at(-1)}`;
};

const parseGoalsFromDb = (goalString) => {
  if (!goalString) return [];
  return GOALS.map(goal => goal.value).filter(value => goalString.includes(value));
};

const sendWelcomeEmail = (session) => {
  axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/notifications/welcome-email`, {}, {
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  }).catch((error) => {
    console.error('Error sending welcome email:', error);
  });
};

const ProfileOnboarding = ({ user, session, onComplete, onClose }) => {
  const isEditing = Boolean(onClose);
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState(() => ({
    ...INITIAL_PROFILE,
    name: getUserDisplayName(user),
  }));
  const [isLoadingProfile, setIsLoadingProfile] = useState(isEditing);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const progressLabel = `Step ${step} of 2 · ${step === 1 ? 'About You' : 'Your Goals'}`;

  const displayName = useMemo(() => {
    return getUserDisplayName(user);
  }, [user]);

  useEffect(() => {
    if (!isEditing) return;
    let isMounted = true;

    const loadExistingProfile = async () => {
      const { data, error } = await supabase
        .from('userProfile')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error('Error loading user profile:', error);
        setSubmitError('Could not load your profile. Please try again.');
      } else if (data) {
        setProfile({
          name: data.name || getUserDisplayName(user),
          gender: data.gender || INITIAL_PROFILE.gender,
          age: data.age != null ? String(data.age) : '',
          height: data.height != null ? String(data.height) : '',
          weight: data.weight != null ? String(data.weight) : '',
          dietType: data.dietType || INITIAL_PROFILE.dietType,
          goal: parseGoalsFromDb(data.goal).length ? parseGoalsFromDb(data.goal) : INITIAL_PROFILE.goal,
          activityLevel: data.activityLevel || INITIAL_PROFILE.activityLevel,
        });
      }

      setIsLoadingProfile(false);
    };

    loadExistingProfile();

    return () => {
      isMounted = false;
    };
  }, [isEditing, user.id]);

  useScrollLock();

  const updateField = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => {
      if (!prev[field]) return prev;
      const nextErrors = { ...prev };
      delete nextErrors[field];
      return nextErrors;
    });
    setSubmitError('');
  };

  const toggleGoal = (goalValue) => {
    setProfile(prev => {
      const nextGoals = prev.goal.includes(goalValue)
        ? prev.goal.filter(selectedGoal => selectedGoal !== goalValue)
        : GOALS.filter(goal => [...prev.goal, goalValue].includes(goal.value)).map(goal => goal.value);

      return { ...prev, goal: nextGoals };
    });

    setFieldErrors(prev => {
      if (!prev.goal) return prev;
      const nextErrors = { ...prev };
      delete nextErrors.goal;
      return nextErrors;
    });
    setSubmitError('');
  };

  const validateStepOne = () => {
    const nextErrors = {};
    const name = profile.name.trim();
    if (name.length < 2) nextErrors.name = 'Enter your name';
    if (name.length > 60) nextErrors.name = 'Name must be 60 characters or fewer';
    if (!profile.gender) nextErrors.gender = 'Select your gender';

    const ageError = validateNumber(profile.age, 10, 100, 'Age');
    const heightError = validateNumber(profile.height, 100, 250, 'Height', 'cm');
    const weightError = validateNumber(profile.weight, 20, 300, 'Weight', 'kg');

    if (ageError) nextErrors.age = ageError;
    if (heightError) nextErrors.height = heightError;
    if (weightError) nextErrors.weight = weightError;
    if (!profile.dietType) nextErrors.dietType = 'Select your diet type';

    return nextErrors;
  };

  const validateStepTwo = () => {
    const nextErrors = {};
    if (profile.goal.length === 0) nextErrors.goal = 'Select at least one goal';
    if (!profile.activityLevel) nextErrors.activityLevel = 'Select your activity level';
    return nextErrors;
  };

  const handleContinue = () => {
    const nextErrors = validateStepOne();
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }
    setStep(2);
    setFieldErrors({});
    setSubmitError('');
  };

  const handleSubmit = async () => {
    const stepOneErrors = validateStepOne();
    const stepTwoErrors = validateStepTwo();
    const nextErrors = { ...stepOneErrors, ...stepTwoErrors };
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      if (Object.keys(stepOneErrors).length > 0) setStep(1);
      return;
    }

    setIsSaving(true);
    setFieldErrors({});
    setSubmitError('');

    const profilePayload = {
      name: profile.name.trim(),
      height: Number(profile.height),
      weight: Number(profile.weight),
      age: Number(profile.age),
      gender: profile.gender,
      dietType: profile.dietType,
      activityLevel: profile.activityLevel,
      goal: formatGoalsForDb(profile.goal),
    };

    const { error: saveError } = isEditing
      ? await supabase.from('userProfile').update(profilePayload).eq('user_id', user.id)
      : await supabase.from('userProfile').insert({ user_id: user.id, ...profilePayload });

    setIsSaving(false);

    if (saveError) {
      console.error('Error saving user profile:', saveError);
      setSubmitError('Could not save your profile. Please try again.');
      return;
    }

    if (!isEditing) sendWelcomeEmail(session);

    onComplete();
  };

  return (
    <div className="profile-modal-overlay">
      <section className="profile-modal-content">
        <div className="profile-accent" />

        <header className="profile-header">
          {onClose && (
            <button className="profile-close-btn" type="button" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          )}
          <h1>{isEditing ? 'Edit Your Profile' : 'Set Up Your Profile'}</h1>
          <p>{progressLabel}</p>
          <div className="profile-progress" aria-hidden="true">
            <span className="active" />
            <span className={step === 2 ? 'active' : ''} />
          </div>
        </header>

        {isLoadingProfile ? (
          <div className="profile-loading">Loading your profile...</div>
        ) : step === 1 ? (
          <div className="profile-content">
            <div className="profile-field">
              <label htmlFor="profile-name">
                <User size={16} />
                Name
              </label>
              <input
                id="profile-name"
                className={fieldErrors.name ? 'field-invalid' : ''}
                type="text"
                value={profile.name}
                placeholder={displayName || 'e.g. Rahul Sharma'}
                maxLength={60}
                autoComplete="name"
                onChange={(e) => updateField('name', e.target.value)}
              />
              {fieldErrors.name && <p className="field-error-text">{fieldErrors.name}</p>}
            </div>

            <div className="profile-section">
              <div className="profile-section-title">
                <VenusAndMars size={16} />
                Gender
              </div>
              <div className="gender-grid">
                {GENDERS.map(gender => {
                  const Icon = gender.Icon;
                  return (
                    <button
                      key={gender.value}
                      className={`profile-choice gender-choice ${profile.gender === gender.value ? 'selected' : ''}`}
                      type="button"
                      onClick={() => updateField('gender', gender.value)}
                    >
                      <Icon className="choice-icon" size={24} />
                      <span>{gender.label}</span>
                    </button>
                  );
                })}
              </div>
              {fieldErrors.gender && <p className="field-error-text">{fieldErrors.gender}</p>}
            </div>

            <div className="profile-field">
              <label htmlFor="profile-age">
                <User size={16} />
                Age
              </label>
              <div className={`unit-input ${fieldErrors.age ? 'field-invalid' : ''}`}>
                <input
                  id="profile-age"
                  type="number"
                  inputMode="numeric"
                  value={profile.age}
                  placeholder="e.g. 23"
                  min="13"
                  max="100"
                  onChange={(e) => updateField('age', e.target.value)}
                />
                <span>yrs</span>
              </div>
              {fieldErrors.age && <p className="field-error-text">{fieldErrors.age}</p>}
            </div>

            <div className="metric-grid">
              <div className="profile-field">
                <label htmlFor="profile-height">
                  <Ruler size={16} />
                  Height
                </label>
                <div className={`unit-input ${fieldErrors.height ? 'field-invalid' : ''}`}>
                  <input
                    id="profile-height"
                    type="number"
                    inputMode="numeric"
                    value={profile.height}
                    placeholder="173"
                    min="80"
                    max="250"
                    onChange={(e) => updateField('height', e.target.value)}
                  />
                  <span>cm</span>
                </div>
                {fieldErrors.height && <p className="field-error-text">{fieldErrors.height}</p>}
              </div>

              <div className="profile-field">
                <label htmlFor="profile-weight">
                  <Scale size={16} />
                  Weight
                </label>
                <div className={`unit-input ${fieldErrors.weight ? 'field-invalid' : ''}`}>
                  <input
                    id="profile-weight"
                    type="number"
                    inputMode="numeric"
                    value={profile.weight}
                    placeholder="70"
                    min="25"
                    max="300"
                    onChange={(e) => updateField('weight', e.target.value)}
                  />
                  <span>kg</span>
                </div>
                {fieldErrors.weight && <p className="field-error-text">{fieldErrors.weight}</p>}
              </div>
            </div>

            <div className="profile-section">
              <div className="profile-section-title">
                <Leaf size={16} />
                Diet Type
              </div>
              <div className="diet-grid">
                {DIET_TYPES.map(diet => (
                  <button
                    key={diet.value}
                    className={`profile-choice diet-choice ${profile.dietType === diet.value ? 'selected' : ''}`}
                    type="button"
                    onClick={() => updateField('dietType', diet.value)}
                  >
                    <diet.Icon className="choice-icon" size={24} />
                    <span>{diet.label}</span>
                  </button>
                ))}
              </div>
              {fieldErrors.dietType && <p className="field-error-text">{fieldErrors.dietType}</p>}
            </div>
          </div>
        ) : (
          <div className="profile-content">
            <div className="profile-section">
              <div className="profile-section-title">
                <Target size={16} />
                Your Goal
              </div>
              <div className="goal-grid">
                {GOALS.map(goal => (
                  <button
                    key={goal.value}
                    className={`profile-choice goal-choice ${profile.goal.includes(goal.value) ? 'selected' : ''}`}
                    type="button"
                    aria-pressed={profile.goal.includes(goal.value)}
                    onClick={() => toggleGoal(goal.value)}
                  >
                    <span className="goal-check" aria-hidden="true" />
                    <goal.Icon className="choice-icon" size={24} />
                    <span className="choice-label">{goal.label}</span>
                    <span className="choice-description">{goal.description}</span>
                  </button>
                ))}
              </div>
              {fieldErrors.goal && <p className="field-error-text">{fieldErrors.goal}</p>}
            </div>

            <div className="profile-section">
              <div className="profile-section-title">
                <Zap size={16} />
                Activity Level
              </div>
              <div className="activity-list">
                {ACTIVITY_LEVELS.map(activity => (
                  <button
                    key={activity.value}
                    className={`profile-choice activity-choice ${profile.activityLevel === activity.value ? 'selected' : ''}`}
                    type="button"
                    onClick={() => updateField('activityLevel', activity.value)}
                  >
                    <span>
                      <span className="choice-label">{activity.label}</span>
                      <span className="choice-description">{activity.description}</span>
                    </span>
                    <span className="activity-dots" aria-hidden="true">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <i key={index} className={index < activity.dots ? 'filled' : ''} />
                      ))}
                    </span>
                  </button>
                ))}
              </div>
              {fieldErrors.activityLevel && <p className="field-error-text">{fieldErrors.activityLevel}</p>}
            </div>
          </div>
        )}

        {submitError && <div className="profile-error">{submitError}</div>}

        {!isLoadingProfile && (
          <footer className="profile-actions">
            {step === 2 && (
              <button className="profile-secondary-btn" type="button" onClick={() => setStep(1)} disabled={isSaving}>
                <ArrowLeft size={22} />
                Back
              </button>
            )}
            <button
              className="profile-primary-btn"
              type="button"
              onClick={step === 1 ? handleContinue : handleSubmit}
              disabled={isSaving}
            >
              {step === 1 ? 'Continue' : isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Get Started'}
              {step === 1 ? <ArrowRight size={22} /> : <Dumbbell size={20} />}
            </button>
          </footer>
        )}
      </section>
    </div>
  );
};

export default ProfileOnboarding;
