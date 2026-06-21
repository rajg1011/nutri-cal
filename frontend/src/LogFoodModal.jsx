import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, ChevronLeft, ChevronRight, Flame, Bookmark, BookmarkCheck, Sunrise, Sun, Moon, Apple, Star, Database, Pencil } from 'lucide-react';
import supabase from '../core/supabaseClient';
import { MEAL_TYPES, MEAL_UNITS } from '../utils/constant';
import LoadingScreen from './LoadingScreen';
import './css/LogFoodModal.css';
import useScrollLock from './hooks/useScrollLock';

const MEAL_ICONS = { Breakfast: Sunrise, Lunch: Sun, Dinner: Moon, Snack: Apple };
const MEALS = MEAL_TYPES.map((id) => ({ id, Icon: MEAL_ICONS[id], label: id }));

const LogFoodModal = ({ user, onClose, onAdd }) => {
  const [selectedMeal, setSelectedMeal] = useState(MEAL_TYPES[0]);
  const [foodSearch, setFoodSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [calories, setCalories] = useState(''); 
  const [foodError, setFoodError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  const [prefName, setPrefName] = useState('');
  const [prefCalories, setPrefCalories] = useState('');
  const [prefProtein, setPrefProtein] = useState('');
  const [prefUnit, setPrefUnit] = useState('Katori');
  const [prefUnitMeansValue, setPrefUnitMeansValue] = useState('');
  const [prefUnitMeansType, setPrefUnitMeansType] = useState('g');
  const [isPrefLoading, setIsPrefLoading] = useState(false);
  const [isEditingSelected, setIsEditingSelected] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const searchWrapperRef = useRef(null);

  const units = MEAL_UNITS;
  const unitHint = (food) => food?.unitMeans || undefined;

  const isFormValid = selectedFood || (foodSearch.trim().length > 0 && calories.trim().length > 0);

  useEffect(() => {
    if (foodSearch.trim().length < 2 || selectedFood) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const globalSearch = supabase
          .from('foodDescription')
          .select('*')
          .or(`name.ilike.%${foodSearch}%,aliases.ilike.%${foodSearch}%`)
          .limit(5);

        const personalSearch = supabase
          .from('userPreference')
          .select('*')
          .eq('user_id', user?.id)
          .ilike('food', `%${foodSearch}%`)
          .limit(3);

        const [globalRes, personalRes] = await Promise.all([globalSearch, personalSearch]);

        const formattedPersonal = (personalRes.data || []).map(p => ({
          id: `pref-${p.id}`,
          name: p.food,
          caloriesPerUnit: p.calories,
          proteinPerUnit: p.protein,
          unit: p.unit,
          unitMeans: p.unitMeans,
          isPreference: true
        }));

        setSearchResults([...formattedPersonal, ...(globalRes.data || [])]);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [foodSearch, selectedFood, user]);

  const showDropdown = !selectedFood && (isSearching || searchResults.length > 0);

  useEffect(() => {
    if (!showDropdown) {
      setDropdownPosition(null);
      return;
    }

    const updatePosition = () => {
      const el = searchWrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < 320 && rect.top > spaceBelow;
      setDropdownPosition({
        left: rect.left,
        width: rect.width,
        ...(openUpward
          ? { bottom: window.innerHeight - rect.top + 12 }
          : { top: rect.bottom + 12 }),
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showDropdown]);

  const handleAddSubmit = async () => {
    if (!isFormValid) return;

    let finalName, finalCalories, finalDetails, finalProtein;

    if (selectedFood) {
      finalName = selectedFood.name;
      finalCalories = Math.round(selectedFood.caloriesPerUnit * quantity);
      finalProtein = selectedFood.proteinPerUnit ? (selectedFood.proteinPerUnit * quantity).toFixed(1) : 0;
      finalDetails = `${quantity} ${selectedFood.unit}`;
    } else {
      const calValue = parseInt(calories, 10);
      if (calValue < 1 || calValue > 10000) {
        setFoodError('Calories must be between 1 and 10,000.');
        return;
      }
      finalName = foodSearch.trim();
      finalCalories = calValue;
      finalProtein = 0;
      finalDetails = '1 Serving';
    }

    setFoodError(null);
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('userCaloriesData')
        .insert([{
          user_id: user?.id,
          food_item: finalName,
          meal_type: selectedMeal.toLowerCase(),
          calories: finalCalories,
          protein: parseFloat(finalProtein) || 0,
          quantity: selectedFood ? quantity : 1,
          meal_unit: selectedFood ? selectedFood.unit : 'Serving'
        }]);

      if (error) throw error;

      onAdd();
      onClose();
    } catch (err) {
      console.error('Error saving food log:', err);
      alert('Failed to save log. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setFoodSearch(food.name);
    setSearchResults([]);
  };

  const handleDeselect = () => {
    setSelectedFood(null);
    setFoodSearch('');
    setQuantity(1);
    setIsEditingSelected(false);
  };

  const handleStartEdit = () => {
    setPrefName(selectedFood.name);
    setPrefCalories(String(selectedFood.caloriesPerUnit ?? ''));
    setPrefProtein(selectedFood.proteinPerUnit ? String(selectedFood.proteinPerUnit) : '');
    setPrefUnit(selectedFood.unit || 'Katori');
    const match = /^(\d+(?:\.\d+)?)(g|ml)$/i.exec(selectedFood.unitMeans || '');
    setPrefUnitMeansValue(match ? match[1] : '');
    setPrefUnitMeansType(match ? match[2].toLowerCase() : 'g');
    setIsEditingSelected(true);
  };

  const adjustQuantity = (amount) => {
    setQuantity(prev => {
      const current = parseFloat(prev) || 0;
      return Math.max(0.5, current + amount);
    });
  };

  const handleSaveToMyFoods = async () => {
    if (!prefName || !prefCalories || !prefUnitMeansValue) return;
    setIsPrefLoading(true);
    try {
      const unitMeans = prefUnitMeansValue ? `${prefUnitMeansValue}${prefUnitMeansType}` : null;
      const { data, error } = await supabase
        .from('userPreference')
        .insert([{
          user_id: user.id,
          food: prefName,
          protein: parseFloat(prefProtein) || 0,
          calories: parseInt(prefCalories),
          unit: prefUnit,
          unitMeans
        }])
        .select();

      if (error) throw error;

      const savedFood = {
        id: `pref-${data[0].id}`,
        name: data[0].food,
        caloriesPerUnit: data[0].calories,
        proteinPerUnit: data[0].protein,
        unit: data[0].unit,
        unitMeans: data[0].unitMeans,
        isPreference: true
      };
      handleSelectFood(savedFood);
      setIsSavingPreference(false);
      setIsEditingSelected(false);
    } catch (err) {
      console.error('Error saving preference:', err);
      alert('Failed to save to my foods');
    } finally {
      setIsPrefLoading(false);
    }
  };

  useEffect(() => {
    if (isSavingPreference) {
      setPrefName(foodSearch);
      setPrefCalories(calories);
      setPrefUnitMeansValue('');
      setPrefUnitMeansType('g');
    }
  }, [isSavingPreference]);

  useScrollLock();

  return (
    <div className="modal-overlay">
      {isSubmitting && <LoadingScreen />}
      <div className="modal-content">
        <div className="modal-header">
          <h2>Log Food</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="section">
            <label className="section-label">MEAL</label>
            <div className="meal-grid">
              {MEALS.map((meal) => (
                <button
                  key={meal.id}
                  className={`meal-btn ${selectedMeal === meal.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMeal(meal.id)}
                >
                  <span className="meal-icon"><meal.Icon size={18} /></span>
                  <span className="meal-label">{meal.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="section">
            <label className="section-label">WHAT DID YOU EAT?</label>
            {!selectedFood ? (
              <div className="search-input-wrapper" ref={searchWrapperRef}>
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search: roti, dal, sabzi, chai..."
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  className="modal-input search-input"
                />
                {showDropdown && dropdownPosition && createPortal(
                  <div className="search-results-dropdown" style={dropdownPosition}>
                    {isSearching ? (
                      <div className="search-loading">Searching Food...</div>
                    ) : (
                      searchResults.map((result) => (
                        <div
                          key={result.id}
                          className="search-result-item"
                          onClick={() => handleSelectFood(result)}
                        >
                          <div className="result-info">
                            <div className="result-name">{result.name}</div>
                            <div className="result-source">{result.isPreference ? <><Star size={13} /> My Foods</> : <><Database size={13} /> NutriCal Data</>}</div>
                          </div>
                          <div className="result-stats">
                            <div className="result-calories">{result.caloriesPerUnit} kcal</div>
                            <div className="result-unit">per {result.unit || 'serving'}</div>
                            {unitHint(result) && (
                              <div className="result-unit-hint">~{unitHint(result)}</div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>,
                  document.body
                )}
              </div>
            ) : (
              <div className="selected-item-card">
                <div className="selected-info">
                  <div className="selected-name">{selectedFood.name}</div>
                  <div className="selected-subtitle">
                    {selectedFood.caloriesPerUnit} kcal per {selectedFood.unit}
                    {unitHint(selectedFood) && (
                      <span className="unit-hint-badge">~{unitHint(selectedFood)}</span>
                    )}
                  </div>
                </div>
                <div className="selected-actions">
                  {!selectedFood.isPreference && !isEditingSelected && (
                    <button className="edit-btn" onClick={handleStartEdit} title="Edit & save to my foods">
                      <Pencil size={16} />
                    </button>
                  )}
                  <button className="deselect-btn" onClick={handleDeselect}>
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {!selectedFood ? (
            <>
              <div className="section">
                <label className="section-label">CALORIES (MANUAL)</label>
                <input
                  type="number"
                  placeholder="e.g. 350"
                  value={calories}
                  onChange={(e) => {
                    setCalories(e.target.value);
                    setFoodError(null);
                  }}
                  className="modal-input"
                  disabled={searchResults.length > 0}
                />
                {foodError && <div className="food-error-message">{foodError}</div>}
              </div>

              {foodSearch.trim().length > 0 && calories.trim().length > 0 && (
                <div className="pref-toggle-container">
                  <button
                    className={`toggle-pref-btn ${isSavingPreference ? 'active' : ''}`}
                    onClick={() => setIsSavingPreference(!isSavingPreference)}
                  >
                    {isSavingPreference ? (
                      <><BookmarkCheck size={16} /> Cancel saving</>
                    ) : (
                      <><Bookmark size={16} /> Save this food for future searches</>
                    )}
                  </button>
                </div>
              )}

              {isSavingPreference && (
                <div className="preference-form-card fade-in">
                  <div className="pref-card-title">Define this food for future use</div>

                  <div className="pref-input-group">
                    <label className="pref-label">Food name <span className="pref-label-required">*</span></label>
                    <input
                      required
                      className="pref-input"
                      value={prefName}
                      onChange={(e) => setPrefName(e.target.value)}
                    />
                  </div>

                  <div className="pref-row">
                    <div className="pref-input-group">
                      <label className="pref-label">Calories per unit <span className="pref-label-required">*</span></label>
                      <input
                        type="number"
                        required
                        className="pref-input"
                        value={prefCalories}
                        onChange={(e) => setPrefCalories(e.target.value)}
                      />
                    </div>
                    <div className="pref-input-group">
                      <label className="pref-label">Unit <span className="pref-label-required">*</span></label>
                      <select
                        required
                        className="pref-input"
                        value={prefUnit}
                        onChange={(e) => setPrefUnit(e.target.value)}
                      >
                        {units.map(u => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pref-input-group">
                    <label className="pref-label">Protein per unit (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="pref-input"
                      value={prefProtein}
                      onChange={(e) => setPrefProtein(e.target.value)}
                      placeholder="e.g. 1.2"
                    />
                  </div>

                  <div className="pref-input-group">
                    <label className="pref-label">What does 1 {prefUnit} mean? <span className="pref-label-required">*</span></label>
                    <div className="pref-unit-means-row">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        required
                        className="pref-unit-means-input"
                        value={prefUnitMeansValue}
                        onChange={(e) => setPrefUnitMeansValue(e.target.value)}
                        placeholder="e.g. 150"
                      />
                      <select
                        className="pref-unit-means-select"
                        value={prefUnitMeansType}
                        onChange={(e) => setPrefUnitMeansType(e.target.value)}
                      >
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                      </select>
                    </div>
                  </div>

                  <button
                    className="save-pref-btn"
                    onClick={handleSaveToMyFoods}
                    disabled={!prefName || !prefCalories || !prefUnitMeansValue || isPrefLoading}
                  >
                    {isPrefLoading ? (
                      'Saving...'
                    ) : (
                      <>
                        Save "<span className="save-pref-btn-name">{prefName || 'food'}</span>" to my foods
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="selected-food-view">
              {isEditingSelected ? (
                <div className="preference-form-card fade-in">
                  <div className="pref-card-title">Edit & save to my foods</div>

                  <div className="pref-input-group">
                    <label className="pref-label">Food name <span className="pref-label-required">*</span></label>
                    <input
                      required
                      className="pref-input"
                      value={prefName}
                      onChange={(e) => setPrefName(e.target.value)}
                    />
                  </div>

                  <div className="pref-row">
                    <div className="pref-input-group">
                      <label className="pref-label">Calories per unit <span className="pref-label-required">*</span></label>
                      <input
                        type="number"
                        required
                        className="pref-input"
                        value={prefCalories}
                        onChange={(e) => setPrefCalories(e.target.value)}
                      />
                    </div>
                    <div className="pref-input-group">
                      <label className="pref-label">Unit <span className="pref-label-required">*</span></label>
                      <select
                        required
                        className="pref-input"
                        value={prefUnit}
                        onChange={(e) => setPrefUnit(e.target.value)}
                      >
                        {units.map(u => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pref-input-group">
                    <label className="pref-label">Protein per unit (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="pref-input"
                      value={prefProtein}
                      onChange={(e) => setPrefProtein(e.target.value)}
                      placeholder="e.g. 1.2"
                    />
                  </div>

                  <div className="pref-input-group">
                    <label className="pref-label">What does 1 {prefUnit} mean? <span className="pref-label-required">*</span></label>
                    <div className="pref-unit-means-row">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        required
                        className="pref-unit-means-input"
                        value={prefUnitMeansValue}
                        onChange={(e) => setPrefUnitMeansValue(e.target.value)}
                        placeholder="e.g. 150"
                      />
                      <select
                        className="pref-unit-means-select"
                        value={prefUnitMeansType}
                        onChange={(e) => setPrefUnitMeansType(e.target.value)}
                      >
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                      </select>
                    </div>
                  </div>

                  <div className="pref-edit-actions">
                    <button className="cancel-edit-btn" onClick={() => setIsEditingSelected(false)}>
                      Cancel
                    </button>
                    <button
                      className="save-pref-btn"
                      onClick={handleSaveToMyFoods}
                      disabled={!prefName || !prefCalories || !prefUnitMeansValue || isPrefLoading}
                    >
                      {isPrefLoading ? (
                        'Saving...'
                      ) : (
                        <>
                          Save "<span className="save-pref-btn-name">{prefName || 'food'}</span>" to my foods
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="quantity-section">
                    <label className="section-label">
                      QUANTITY
                      {unitHint(selectedFood) && (
                        <span className="quantity-unit-hint">1 {selectedFood.unit} = {unitHint(selectedFood)}</span>
                      )}
                    </label>
                    <div className="quantity-control">
                      <button className="q-btn" onClick={() => adjustQuantity(-0.5)}>
                        <ChevronLeft size={20} />
                      </button>
                      <div className="q-value-display">
                        <input
                          type="number"
                          className="q-number-input"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                          onBlur={() => {
                            if (quantity === '' || quantity < 0.5) setQuantity(0.5);
                          }}
                          step="0.5"
                          min="0.5"
                        />
                        <span className="q-unit">{selectedFood.unit}</span>
                      </div>
                      <button className="q-btn" onClick={() => adjustQuantity(0.5)}>
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="total-calories-display">
                    <div className="total-cal-val">
                      <Flame size={18} fill="var(--primary-green)" />
                      {Math.round(selectedFood.caloriesPerUnit * quantity)}
                    </div>
                    <div className="total-cal-lbl">kcal total</div>
                  </div>
                </>
              )}
            </div>
          )}

          <button
            className={`add-food-btn ${!isFormValid ? 'disabled' : ''}`}
            disabled={!isFormValid}
            onClick={handleAddSubmit}
          >
            Add to {selectedMeal}
          </button>

          <div className="modal-handle"></div>
        </div>
      </div>
    </div>
  );
};

export default LogFoodModal;
